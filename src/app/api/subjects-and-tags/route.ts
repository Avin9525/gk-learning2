import { NextResponse } from 'next/server';
import { databases } from '@/lib/appwrite-client';
import { Query } from 'appwrite';

export async function GET() {
  try {
    // Get all questions to extract unique subjects and tags
    const subjects = new Set<string>();
    const tags = new Set<string>();
    
    // Use pagination to get all questions
    let offset = 0;
    const limit = 100;
    let hasMore = true;
    
    while (hasMore) {
      const questions = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID!,
        [
          Query.limit(limit),
          Query.offset(offset)
        ]
      );
      
      // Extract unique subjects and tags
      questions.documents.forEach((question: any) => {
        if (question.subject) {
          subjects.add(question.subject);
        }
        if (Array.isArray(question.tags)) {
          question.tags.forEach((tag: string) => tags.add(tag));
        }
      });
      
      // Check if we need to fetch more
      if (questions.documents.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

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