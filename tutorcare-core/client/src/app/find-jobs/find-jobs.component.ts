import {Component, OnInit, ChangeDetectionStrategy, Inject, Output, EventEmitter} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GeolocationPositionWithUser } from '../models/geolocationposition.model';
import { Post } from '../models/post.model';
import { FindJobsService } from './find-jobs.service';
import {MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { select, Store } from '@ngrx/store';
import { AppState } from '../reducers';
import { getCurrUser, isLoggedIn } from '../auth/auth.selectors';
import { User } from '../models/user.model';
import { ThisReceiver } from '@angular/compiler';
import { Observable } from 'rxjs';
import { ApplyJobDialog } from './apply-job/apply-job.component';
import { ToastrService } from 'ngx-toastr';
import { taggedTemplate } from '@angular/compiler/src/output/output_ast';
import { NgSelectModule } from '@ng-select/ng-select';
import { DateValidator } from './date.validator';


interface FilterOption {
    value: string;
    viewValue: string;
  }
@Component({
  selector: 'find-jobs-component',
  templateUrl: './find-jobs.component.html',
  styleUrls: ['./find-jobs.component.scss']
})
export class FindJobsComponent implements OnInit {
    selectedValue: string | undefined
    rate: number = 4.5
    userCategory: string = ""
    posts: Post[] = []
    div1: boolean = false;
    search: string =""
    userType!: string
    user!: User
    userId!: string
    filteredSearch: boolean = false
    isLoggedIn!: boolean
    filtered: boolean = false
    filter_options: FilterOption[] = [
        {value: 'tutoring-0', viewValue: 'Type: Tutoring'},
        {value: 'babysitting-1', viewValue: 'Type: Babysitting'},
        {value: 'other-2', viewValue: 'Type: Other'}
    ];
    displayedPosts: Post[] = []
    menuVisible: boolean
    mainCol: boolean
    constructor(private router: Router, private findJobs: FindJobsService, public dialog: MatDialog, private route: ActivatedRoute, private store: Store<AppState>, private toastr: ToastrService) {}

    openDialog() {
      if (this.isLoggedIn) {
        const dialogConfig = new MatDialogConfig();

        dialogConfig.disableClose = false;
        // dialogConfig.autoFocus = true;
        dialogConfig.data = {
          id: 1,
          title: 'Create Job Posting',
          posts: this.posts as Post[]
        };
        dialogConfig.height = "90%"
        dialogConfig.width = "90%"
        const dialogRef = this.dialog.open(CreateJobDialog, dialogConfig);

        dialogRef.afterClosed().subscribe(
          data =>  {
            console.log("Dialog output:", data)
            if (data.posts) {
              this.posts = data?.posts
              this.displayedPosts = data?.posts
            }
          }
        );
      } else {
        this.toastr.error("You must be logged in to do this.", "Error", {closeButton: true, timeOut: 5000, progressBar: true})
      }
    }
    filter(value: string) {
      this.filtered = true
      if (value === 'tutoring-0') {
        var postsCopy = this.posts
        this.displayedPosts = postsCopy.filter(post => {
          return post.care_type === "tutoring"
        })
      } else if (value === 'babysitting-1') {
        var postsCopy = this.posts
        this.displayedPosts = postsCopy.filter(post => {
          return post.care_type === 'baby-sitting'
        })
      } else {
        var postsCopy = this.posts
        this.displayedPosts = postsCopy.filter(post => {
          return post.care_type === 'other'
        })
      }
    }
    searchPosts() {
      if (this.search.length > 2) {
        var newPosts: Post[] = []
        for (let post of this.posts) {
          for (let tag of post.tagList) {
            console.log(tag)
            if (tag.indexOf(this.search) !== -1) {
              newPosts.push(post)
              break
            }
          }
          if (post.title.indexOf(this.search) !== -1 && !newPosts.includes(post)) {
            newPosts.push(post)
          }
          if (post.care_type.indexOf(this.search) !== -1 && !newPosts.includes(post)) {
            newPosts.push(post)
          }
        }
        this.filteredSearch = true
        this.displayedPosts = newPosts
      }
    }
    resetFilters() {
      this.filtered = false
      this.displayedPosts = this.posts
    }

    resetSearchFilter() {
      this.filtered = false
      this.displayedPosts = this.posts
      this.search = ""
    }
    openApplyDialog(post: Post) {
      if (this.isLoggedIn) {
        const dialogConfig = new MatDialogConfig();

        dialogConfig.disableClose = false;
        // dialogConfig.autoFocus = true;
        dialogConfig.data = {
          id: 1 as number,
          title: 'Apply to this Job Posting' as string,
          post: post as Post,
          posts: this.posts as Post[]
        };
        dialogConfig.height = "90%"
        dialogConfig.width = "90%"
        const dialogRef = this.dialog.open(ApplyJobDialog, dialogConfig);

        dialogRef.afterClosed().subscribe(
          data => {
            console.log("Dialog output:", data)
          }
        );
        console.log(dialogConfig.data.posts)
        this.posts = dialogConfig.data.posts
      } else {
        this.toastr.error("You must be logged in to do this.", "Error", {closeButton: true, timeOut: 5000, progressBar: true})
      }
    }

    div1Function(){
      this.div1=!this.div1;
    }

    editPost(post: Post) {
      this.router.navigate(['/find-jobs/my-job-postings/' + post.post_id])
    }

    ngOnInit() {
      this.store
      .pipe(
        select(isLoggedIn)
      ).subscribe(data2 => {
        this.isLoggedIn = data2
      })
      this.store
        .pipe(
            select(getCurrUser)
        ).subscribe(data =>  {
          this.user = data
          if (this.user !== undefined) {
            this.userId = this.user.user_id || ""
            this.userType = this.user.user_category
          }
        })
        this.findJobs.getPosts().subscribe(data => {
            this.posts = data
            var postsCopy: Post[] = []
            if (this.posts) {
              for (var post of this.posts) {
                var tempTags = post.tags.split(" ")
                tempTags = tempTags.filter(obj => obj.length < 40)
                var tempTags2: string[] = []
                for (var tag of tempTags){
                  tag = tag.replace("_", " ")
                  tempTags2.push(tag)
                }
                post.tagList = tempTags2
                postsCopy.push(post)
              }
            }
            this.posts = postsCopy
            this.displayedPosts = postsCopy

        })
    }

    onFindCareClick() {
        this.router.navigate(['/find-care'])
    }

    backToMenu() {
      this.mainCol = false
      this.menuVisible = true
    }
}

interface Tag {
  display: string,
  value: string
}
@Component({
  selector: 'create-job',
  templateUrl: 'create-job.html',
  styleUrls: ['./create-job.component.scss'],
  providers: [
    { provide: MatFormFieldControl, useExisting: CreateJobDialog }
  ]
})
export class CreateJobDialog implements OnInit{
  @Output() newPosts = new EventEmitter<Post[]>();
  post!: Post
  form!: FormGroup
  dateGroup!: FormGroup
  date!: string
  date2!: string
  type_care!: string
  job_desc!: string
  end_date!: string
  start_date!: string
  picker!: string
  endTimeFC = new FormControl()
  startTimeFC = new FormControl()
  start_time!: string
  end_time!: string
  user!: User
  userId!: string
  month!: number
  dayStr!: string
  monthStr!: string
  day!: number
  title!: string
  tags!: string
  selectedTags: string[] = []
  tagString: string = ""
  items: Tag[] =
  [
    {display: 'Tutoring', value: 'Tutoring'},
    {display: 'Baby-sitting', value: 'Baby-sitting'},
    {display: 'Dog-sitting', value: 'Dog-sitting'},
    {display: 'House-sitting', value: 'House-sitting'},
    {display: 'Math', value: 'Math'},
    {display: 'Chemistry', value: 'Chemistry'},
    {display: 'Biology', value: 'Biology'},
    {display: 'Calculus', value: 'Calculus'},
    {display: 'Physics', value: 'Physics'},
    {display: 'Algebra', value: 'Algebra'},
    {display: 'Geometry', value: 'Geometry'},
    {display: 'Computer Science', value: 'Computer_Science'},
    {display: 'Mechanical Engineering', value: 'Mechanical_Engineering'},
    {display: 'Neuroscience', value: 'Neuroscience'},
    {display: 'Chemical Engineering', value: 'Chemical_Engineering'},
    {display: 'Industrial Engineering', value: 'Industrial_Engineering'},
    {display: 'Aeronautical Engineering', value: 'Aeuronautical_Engineering'},
    {display: 'Industrial Engineering', value: 'Industrial_Engineering'},
    {display: 'Business', value: 'Business'},
    {display: 'Linear Algebra', value: 'Linear_Algebra'},
    {display: 'Multivariable Calculus', value: 'Multivariable_Calculus'},
    {display: 'Ages 0-2', value: 'Ages_0-2'},
    {display: 'Ages 3-6', value: 'Ages_3-6'},
    {display: 'Ages 7-10', value: 'Ages_7-10'},
    {display: 'Ages 11-14', value: 'Ages_11-14'},
    {display: 'Ages 15-17', value: 'Ages_15-17'},
  ]

  _createJobObservable: Observable<Post> | undefined
  minDate1: Date = (new Date())
  minDate2: Date = (new Date())
  maxDate: Date = new Date()
  filter_options: FilterOption[] = [
    {value: 'tutoring-0', viewValue: 'Type: Tutoring'},
    {value: 'babysitting-1', viewValue: 'Type: Babysitting'},
    {value: 'other-2', viewValue: 'Type: Other'}
];

validation_messages = {
  'care_type': [
    { type: 'required', message: 'Type is required' }
  ],
  'job_title': [
    { type: 'required', message: 'Title is required' },
    { type: 'maxlength', message: 'Title cannot be more than 50 characters long' }
  ],
  'job_desc': [
    { type: 'required', message: 'Job decription is required' },
    { type: 'maxlength', message: 'Description cannot be more than 1023 characters long' }
  ],
  'start_time': [
    { type: 'required', message: 'Starting date and time are required' },
  ],
  'end_time': [
    { type: 'required', message: 'Ending date and time are required' },
    { type: 'dateLessThan', message: 'Ending time must be after starting time'} //BUG: does not show
  ]

}


  constructor(
    public dialogRef: MatDialogRef<CreateJobDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder, private store: Store<AppState>, private findJobs: FindJobsService) {
      this.minDate2.setDate((new Date()).getDate() + 1)
      this.minDate1.setDate((new Date()).getDate() + 1)
      this.minDate2.setHours((new Date()).getHours() + 1)
      this.maxDate.setMonth((new Date()).getMonth() + 3)
  }

  onStartTimeChange() {
    this.start_time = this.startTimeFC.value
  }
  onEndTimeChange() {
    this.end_time = this.endTimeFC.value
  }

  ngOnInit() {
    this.dateGroup = new FormGroup({
      start_time: new FormControl('', Validators.compose([
        Validators.required
      ])),
      end_time: new FormControl('', Validators.compose([
        Validators.required
      ]))
    })

    this.form = this.fb.group({
      type_care: new FormControl('', Validators.compose([
        Validators.required
      ])),
      job_title: new FormControl('', Validators.compose([
        Validators.required,
        Validators.maxLength(50)
      ])),
      job_desc: new FormControl('', Validators.compose([
        Validators.required,
        Validators.maxLength(1023)
      ])),
      posts: new FormControl([]),
      dateGroup: this.dateGroup
    });
    this.store
        .pipe(
            select(getCurrUser)
        ).subscribe(data =>  {
            this.user = data
            this.userId = this.user.user_id || ""
    })

  }

  save() {
    var start_time = new Date(this.form.value.dateGroup.start_time)
    var end_time = new Date(this.form.value.dateGroup.end_time)
    this.job_desc = this.form.value.job_desc
    if (this.form.value.type_care == "tutoring-0") {
      this.type_care = "tutoring"
    } else if (this.form.value.type_care == "babysitting-1") {
      this.type_care = "baby-sitting"
    } else if (this.form.value.type_care == "other-2") {
      this.type_care = "other"
    }
    this.month = start_time.getMonth() + 1
    this.day = start_time.getDate()
    if (this.month < 10) {
      this.monthStr = '0' + this.month
    } else {
      this.monthStr = this.month.toString()
    }
    if (this.day < 10) {
      this.dayStr = '0' + this.day
    } else {
      this.dayStr = this.day.toString()
    }
    for (let val of this.selectedTags) {
      if (this.tagString === "") {
        this.tagString = val.toLowerCase()
      } else {
        this.tagString = this.tagString + " " + val.toLowerCase()
      }
    }
    this.start_date = start_time.getFullYear() + '-' + this.monthStr + '-' + this.dayStr

    this.month = end_time.getMonth() + 1
    this.day = end_time.getDate()
    if (this.month < 10) {
      this.monthStr = '0' + this.month
    } else {
      this.monthStr = this.month.toString()
    }
    if (this.day < 10) {
      this.dayStr = '0' + this.day
    } else {
      this.dayStr = this.day.toString()
    }
    this.end_date = end_time.getFullYear() + '-' + this.monthStr + '-' + this.dayStr

    this.start_time = start_time.getHours() + ':' + start_time.getMinutes()
    this.end_time = end_time.getHours() + ':' + end_time.getMinutes()
    this.title = this.form.value.job_title
    this.tags = this.tagString
    this._createJobObservable = this.findJobs.createPost(this.userId, this.title, this.job_desc, this.tags, this.type_care, this.start_date, this.start_time, this.end_date, this.end_time)

    this._createJobObservable.subscribe((data2: Post) => {
        this.post = data2
        if (this.data.posts && this.data.posts instanceof Array) {
          var temp: any[] = this.data.posts.unshift(this.post)
          this.form.value.posts = this.data.posts
        }

    });
    this.dialogRef.close(this.form.value);
  }

  close() {
    this.dialogRef.close();
  }

}

