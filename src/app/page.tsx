'use client';

import { useState, useEffect } from 'react';
import { getQuestions } from '@/lib/appwrite';
import { Question } from '@/types';
import QuestionCard from '@/components/QuestionCard';

export default function HomePage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const response = await getQuestions();
                setQuestions(response.documents as Question[]);
                setLoading(false);
            } catch (err) {
                setError('Failed to load questions');
                setLoading(false);
                console.error('Error fetching questions:', err);
            }
        };

        fetchQuestions();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="container mx-auto px-4">
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="container mx-auto px-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-900">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">MCQ Questions</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {questions.map((question) => (
                        <QuestionCard key={question.$id} question={question} />
                    ))}
                </div>

                {questions.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-900">No questions available. Add some questions to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
