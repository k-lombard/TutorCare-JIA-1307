import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';

@Component({
  selector: 'home-component',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class HomeComponent implements OnInit {
  constructor() {}

  ngOnInit() {
  }



}