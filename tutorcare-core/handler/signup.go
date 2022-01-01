package handler

import (
	"fmt"
	"hash/fnv"
	"main/models"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-chi/render"
	"github.com/go-redis/redis/v8"
	"github.com/golang-jwt/jwt/v4"
	uuid "github.com/nu7hatch/gouuid"
)

func (r routes) signup(rg *gin.RouterGroup) {
	users := rg.Group("/")

	users.POST("/", signupPage)
}

func (r routes) login(rg *gin.RouterGroup) {
	users := rg.Group("/")

	users.POST("/", loginPage)
}

var Client *redis.Client

func init() {
	// dsn := os.Getenv("REDIS_DSN")
	// if len(dsn) == 0 {
	// 	dsn = "localhost:6379"
	// }
	url, err2 := redis.ParseURL("redis://redis:6379")
	if err2 != nil {
		panic(err2)
	}
	Client = redis.NewClient(url)
	_, err := Client.Ping(Client.Context()).Result()
	if err != nil {
		panic(err)
	}
}

func signupPage(c *gin.Context) {
	r := c.Request
	if r.Method != "POST" {
		http.ServeFile(c.Writer, r, "signup.html")
		return
	}
	user := &models.User{}

	if err := render.Bind(r, user); err != nil {
		c.JSON(http.StatusBadRequest, "Bad Request")
		return
	}
	isUnique := dbInstance.Signup(user)

	switch {
	case user.Email != "" && isUnique == true:
		userOut1, err := dbInstance.AddUser(user)
		if err != nil {
			c.JSON(http.StatusBadRequest, "Bad Request")
			return
		}
		c.JSON(http.StatusOK, userOut1)
	case isUnique == false:
		c.JSON(http.StatusInternalServerError, "Server error, unable to create your account. User with email already exists")
		return
	default:
		http.Redirect(c.Writer, r, "/", 301)
	}
}

func loginPage(c *gin.Context) {
	r := c.Request
	if r.Method != "POST" {
		http.ServeFile(c.Writer, r, "login.html")
		return
	}
	user := &models.User{}
	if err := render.Bind(r, user); err != nil {
		c.JSON(http.StatusUnprocessableEntity, "Invalid json provided")
		return
	}
	userOut, isMatch := dbInstance.Login(user)
	if isMatch == false {
		c.JSON(http.StatusNotFound, "Resource not found")
		return
	}
	c.JSON(http.StatusOK, userOut)
	h := fnv.New64a()
	h.Write([]byte(userOut.UserID.String()))
	summedUserID := h.Sum64()
	ts, err := NewToken(summedUserID)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, err.Error())
		return
	}
	saveErr := AuthFunc(summedUserID, ts)
	if saveErr != nil {
		c.JSON(http.StatusUnprocessableEntity, saveErr.Error())
	}

	tokens := map[string]string{
		"access_token":  ts.AccessToken,
		"refresh_token": ts.RefreshToken,
	}
	c.JSON(http.StatusOK, tokens)
}

func NewToken(userid uint64) (*models.TokenDetails, error) {
	td := &models.TokenDetails{}
	td.AtExpires = time.Now().Add(time.Minute * 20).Unix()
	newUuid, err3 := uuid.NewV4()
	if err3 != nil {
		fmt.Println("Error creating v4 uuid: ", err3)
		return td, err3
	}
	td.AccessUuid = newUuid.String()
	td.RtExpires = time.Now().Add(time.Hour * 24 * 7).Unix()
	refreshUuid, err2 := uuid.NewV4()
	if err2 != nil {
		fmt.Println("Error creating v4 uuid: ", err2)
		return td, err2
	}
	td.RefreshUuid = refreshUuid.String()

	var err error
	accessTokenClaims := jwt.MapClaims{}
	accessTokenClaims["authorized"] = true
	accessTokenClaims["access_uuid"] = td.AccessUuid
	accessTokenClaims["user_id"] = userid
	accessTokenClaims["exp"] = td.AtExpires
	at := jwt.NewWithClaims(jwt.SigningMethodHS256, accessTokenClaims)
	td.AccessToken, err = at.SignedString([]byte(os.Getenv("ACCESS_SECRET")))
	if err != nil {
		return td, err
	}
	refreshTokenClaims := jwt.MapClaims{}
	refreshTokenClaims["refresh_uuid"] = td.RefreshUuid
	refreshTokenClaims["user_id"] = userid
	refreshTokenClaims["exp"] = td.RtExpires
	rt := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshTokenClaims)
	td.RefreshToken, err = rt.SignedString([]byte(os.Getenv("REFRESH_SECRET")))
	if err != nil {
		return nil, err
	}

	return td, nil
}

func AuthFunc(userid uint64, td *models.TokenDetails) error {
	at := time.Unix(td.AtExpires, 0)
	rt := time.Unix(td.RtExpires, 0)
	now := time.Now()

	errAccess := Client.Set(Client.Context(), td.AccessUuid, strconv.Itoa(int(userid)), at.Sub(now)).Err()
	if errAccess != nil {
		return errAccess
	}
	errRefresh := Client.Set(Client.Context(), td.RefreshUuid, strconv.Itoa(int(userid)), rt.Sub(now)).Err()
	if errRefresh != nil {
		return errRefresh
	}
	return nil
}

func homePage(res http.ResponseWriter, req *http.Request) {
	http.ServeFile(res, req, "index.html")
}
