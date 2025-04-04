import { Client, Databases, ID, Query } from 'appwrite';
import { Question, Progress } from '@/types';

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
export const COLLECTIONS = {
    QUESTIONS: process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID!,
    PROGRESS: process.env.NEXT_PUBLIC_APPWRITE_PROGRESS_COLLECTION_ID!
};

export const createQuestion = async (questionData: Omit<Question, '$id' | '$collectionId' | '$databaseId' | '$createdAt' | '$updatedAt' | '$permissions'>) => {
    return databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.QUESTIONS,
        ID.unique(),
        questionData
    );
};

export const getQuestions = async () => {
    return databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.QUESTIONS
    );
};

export const getQuestionsBySubject = async (subject: string) => {
    return databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.QUESTIONS,
        [Query.equal('subject', subject)]
    );
};

export const getQuestionsByTags = async (tags: string[]) => {
    return databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.QUESTIONS,
        [Query.search('tags', tags.join(' '))]
    );
};

export const getQuestionsBySubjectAndTags = async (subject: string, tags: string[]) => {
    return databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.QUESTIONS,
        [
            Query.equal('subject', subject),
            Query.search('tags', tags.join(' '))
        ]
    );
};

export const createProgress = async (progressData: Omit<Progress, '$id' | '$collectionId' | '$databaseId' | '$createdAt' | '$updatedAt' | '$permissions'>) => {
    return databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PROGRESS,
        ID.unique(),
        progressData
    );
};

export const updateProgress = async (progressId: string, progressData: Partial<Progress>) => {
    return databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PROGRESS,
        progressId,
        progressData
    );
};

export const getProgressByUserId = async (userId: string) => {
    return databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROGRESS,
        [Query.equal('userId', userId)]
    );
};

export const getProgressByQuestionId = async (userId: string, questionId: string) => {
    return databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROGRESS,
        [
            Query.equal('userId', userId),
            Query.equal('questionId', questionId)
        ]
    );
};

export const getQuestionsForReview = async (userId: string, limit: number = 10) => {
    const today = new Date().toISOString().split('T')[0];
    
    return databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROGRESS,
        [
            Query.equal('userId', userId),
            Query.lessThanEqual('nextReview', today),
            Query.orderDesc('masteryLevel'),
            Query.limit(limit)
        ]
    );
};

export const getQuestionsForNewTest = async (userId: string, limit: number = 5) => {
    const progress = await getProgressByUserId(userId);
    const attemptedQuestionIds = progress.documents.map((p: any) => p.questionId);
    
    if (attemptedQuestionIds.length === 0) {
        return databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.QUESTIONS,
            [Query.limit(limit)]
        );
    }
    
    return databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.QUESTIONS,
        [
            Query.notEqual('$id', attemptedQuestionIds),
            Query.limit(limit)
        ]
    );
};

export const getQuestionsForTest = async (
    userId: string,
    subject?: string,
    tags?: string[],
    limit: number = 10,
    includeNewQuestions: boolean = true
) => {
    try {
        // Get user's progress
        const progressResponse = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PROGRESS,
            [
                Query.equal('userId', userId),
                Query.orderDesc('lastReviewed'),
                Query.limit(100)
            ]
        );

        // Get questions based on filters
        let questionsQuery = [];
        if (subject) {
            questionsQuery.push(Query.equal('subject', subject));
        }
        if (tags && tags.length > 0) {
            questionsQuery.push(Query.search('tags', tags.join(' ')));
        }

        // Get questions
        const questionsResponse = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.QUESTIONS,
            [
                ...questionsQuery,
                Query.orderDesc('$createdAt'),
                Query.limit(100)
            ]
        );

        // Get questions that need review (due for review)
        const dueForReview = progressResponse.documents
            .filter((p: any) => new Date(p.nextReview) <= new Date())
            .map((p: any) => p.questionId);

        // Get questions that haven't been attempted
        const attemptedQuestionIds = progressResponse.documents.map((p: any) => p.questionId);
        const newQuestions = questionsResponse.documents
            .filter((q: any) => !attemptedQuestionIds.includes(q.$id));

        // Combine and prioritize questions
        let selectedQuestions: any[] = [];
        
        if (includeNewQuestions && newQuestions.length > 0) {
            // Include some new questions
            const newQuestionsCount = Math.min(Math.ceil(limit * 0.3), newQuestions.length);
            selectedQuestions = selectedQuestions.concat(
                newQuestions
                    .sort(() => Math.random() - 0.5)
                    .slice(0, newQuestionsCount)
            );
        }

        // Add questions due for review
        if (dueForReview.length > 0) {
            const dueQuestions = questionsResponse.documents
                .filter((q: any) => dueForReview.includes(q.$id));
            selectedQuestions = selectedQuestions.concat(
                dueQuestions
                    .sort(() => Math.random() - 0.5)
                    .slice(0, limit - selectedQuestions.length)
            );
        }

        // If we still need more questions, add random ones
        if (selectedQuestions.length < limit) {
            const remainingQuestions = questionsResponse.documents
                .filter((q: any) => !selectedQuestions.some((sq: any) => sq.$id === q.$id));
            selectedQuestions = selectedQuestions.concat(
                remainingQuestions
                    .sort(() => Math.random() - 0.5)
                    .slice(0, limit - selectedQuestions.length)
            );
        }

        return {
            total: selectedQuestions.length,
            documents: selectedQuestions
        };
    } catch (error) {
        console.error('Error getting questions for test:', error);
        throw error;
    }
};

export const calculateNextReview = (progress: Progress, isCorrect: boolean): string => {
    const today = new Date();
    let daysToAdd = 1;
    
    if (progress.masteryLevel >= 90) {
        daysToAdd = 30;
    } else if (progress.masteryLevel >= 70) {
        daysToAdd = 14;
    } else if (progress.masteryLevel >= 50) {
        daysToAdd = 7;
    } else if (progress.masteryLevel >= 30) {
        daysToAdd = 3;
    } else {
        daysToAdd = 1;
    }
    
    if (isCorrect) {
        daysToAdd = Math.floor(daysToAdd * 1.2);
    } else {
        daysToAdd = Math.max(1, Math.floor(daysToAdd * 0.5));
    }
    
    const nextReview = new Date(today);
    nextReview.setDate(today.getDate() + daysToAdd);
    
    return nextReview.toISOString().split('T')[0];
};

export const calculateMasteryLevel = (progress: Progress): number => {
    const correctRatio = progress.totalAttempts > 0 
        ? progress.correctCount / progress.totalAttempts 
        : 0;
    
    const streakBonus = Math.min(progress.streakCount * 5, 20);
    
    const masteryLevel = Math.min(100, Math.floor(correctRatio * 100) + streakBonus);
    
    return masteryLevel;
}; 