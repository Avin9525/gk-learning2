import { Models } from 'appwrite';

export interface Question {
    $id: string;
    $collectionId: string;
    $databaseId: string;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[];
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    tags: string[];
    subject: string;
}

export interface QuestionCardProps {
    question: Question;
    onNext: () => void;
}

export interface Progress {
    $id: string;
    $collectionId: string;
    $databaseId: string;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[];
    userId: string;
    questionId: string;
    lastReviewed: string;
    nextReview: string;
    correctCount: number;
    incorrectCount: number;
    totalAttempts: number;
    masteryLevel: number; // 0-100 scale
    reviewCount: number; // How many times this question has been reviewed
    lastAnswerCorrect: boolean; // Whether the last attempt was correct
    streakCount: number; // Consecutive correct answers
    difficultyRating: number; // User-rated difficulty (1-5)
    notes: string; // User notes about this question
} 