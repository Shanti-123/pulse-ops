import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

interface Message {
  id: number;
  type: 'user' | 'ai';
  text: string;
  queryType?: string;
  data?: any;
  isTyping?: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-nlq',
  templateUrl: './nlq.component.html',
  styleUrls: ['./nlq.component.scss'],
})
export class NlqComponent implements OnInit {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;
  @ViewChild('inputRef') inputRef!: ElementRef;

  messages: Message[] = [];
  question = '';
  isLoading = false;
  private msgIdCounter = 0;

  suggestions = [
    'How many critical incidents are open?',
    'Show me services that are down',
    'What was the last deployment?',
    'How many incidents happened today?',
    'Which services have the most errors?',
    'Show me fatal logs from the last hour',
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.addWelcomeMessage();
  }

  addWelcomeMessage(): void {
    this.messages.push({
      id: ++this.msgIdCounter,
      type: 'ai',
      text: 'Hello! I\'m the PulseOps AI Query Engine. Ask me anything about your infrastructure — incidents, services, metrics, logs, or deployments.',
      timestamp: new Date(),
    });
  }

  ask(question?: string): void {
    const q = (question || this.question).trim();
    if (!q || this.isLoading) return;

    // Add user message
    this.messages.push({
      id: ++this.msgIdCounter,
      type: 'user',
      text: q,
      timestamp: new Date(),
    });

    this.question = '';
    this.isLoading = true;
    this.scrollToBottom();

    // Add typing indicator
    const typingId = ++this.msgIdCounter;
    this.messages.push({
      id: typingId,
      type: 'ai',
      text: '',
      isTyping: true,
      timestamp: new Date(),
    });

    this.scrollToBottom();

    this.api.naturalLanguageQuery(q).subscribe({
      next: (res) => {
        // Remove typing indicator
        this.messages = this.messages.filter(m => m.id !== typingId);

        if (res.success) {
          this.messages.push({
            id: ++this.msgIdCounter,
            type: 'ai',
            text: res.data.answer,
            queryType: res.data.queryType,
            data: res.data.data,
            timestamp: new Date(),
          });
        } else {
          this.addErrorMessage('Sorry, I could not process that query.');
        }

        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        this.messages = this.messages.filter(m => m.id !== typingId);
        this.addErrorMessage(
          err?.error?.message || 'Something went wrong. Please try again.'
        );
        this.isLoading = false;
        this.scrollToBottom();
      }
    });
  }

  addErrorMessage(text: string): void {
    this.messages.push({
      id: ++this.msgIdCounter,
      type: 'ai',
      text,
      timestamp: new Date(),
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.ask();
    }
  }

  clearChat(): void {
    this.messages = [];
    this.addWelcomeMessage();
  }

  scrollToBottom(): void {
    setTimeout(() => {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  }

  getQueryTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      incidents:   '◉',
      services:    '◈',
      metrics:     '◎',
      logs:        '▤',
      deployments: '⬡',
      general:     '◎',
    };
    return icons[type] || '◎';
  }
}