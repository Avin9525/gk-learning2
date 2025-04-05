import { NextResponse } from 'next/server';
import { databases } from '@/lib/appwrite-client';
import { Query } from 'appwrite';

export async function GET() {
  try {
    // Get all questions to extract unique subjects and tags
    const questions = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID!
    );

    // Extract unique subjects and tags
    const subjects = new Set<string>();
    const tags = new Set<string>();

    questions.documents.forEach((question: any) => {
      if (question.subject) {
        subjects.add(question.subject);
      }
      if (Array.isArray(question.tags)) {
        question.tags.forEach((tag: string) => tags.add(tag));
      }
    });

    return NextResponse.json({
      subjects: Array.from(subjects).sort(),
      tags: Array.from(tags).sort()
    });
  } catch (error) {
    console.error('Error fetching subjects and tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subjects and tags' },
      { status: 500 }
    );
  }
} 