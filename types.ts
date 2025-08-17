export enum Category {
  All = "All",
  Saved = "Saved",
  Music = "Music",
  Literature = "Literature",
  Theater = "Theater",
  Photography = "Photography",
  LocalCulture = "Local Culture",
}

export enum EventType {
  All = "All",
  Concert = "کنسرت",
  Exhibition = "نمایشگاه",
  Theater = "تئاتر",
}

export enum View {
  Articles = "articles",
  Events = "events",
}

export interface User {
  id: number;
  name: string;
  isAuthor: boolean;
  authorId?: number; // Links to an Author profile if the user is an author
}

export interface Author {
  id: number;
  name: string;
  avatarUrl: string;
  bio: string;
}

export interface Article {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  imageHeight: number; // For varied masonry layout
  category: Category;
  date: string;
  views: string;
  likes: string;
  language: 'fa';
  authorId: number;
  videoUrl?: string;
  tags?: string[];
}

export interface Event {
  id: number;
  title: string;
  eventType: EventType;
  date: string; // e.g., "2024-08-15"
  time: string; // e.g., "۲۰:۰۰"
  location: {
    name: string;
    mapUrl: string;
  };
  imageUrl: string;
  description: string;
  ticketUrl: string;
}

export interface Comment {
    id: string;
    articleId: number;
    author: string;
    text: string;
    timestamp: string; // ISO date string
}

export interface CategoryFilter {
  key: Category | EventType;
  label: string;
}

export interface NewArticleData {
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  imageHeight: number;
  category: Category;
  authorId: number;
}
