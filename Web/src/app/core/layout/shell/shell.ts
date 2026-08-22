import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {}
