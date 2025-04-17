import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {
  @Input() borderColor: string = 'from-purple-600 to-pink-500';
  @Input() animate: boolean = true;
  @Input() delay: number = 0;
}