'use client';

import { useState } from 'react';
import { Question } from '@/types';

interface QuestionCardProps {
  question: Question;
  onNext?: () => void;
}

export default function QuestionCard({ question, onNext }: QuestionCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
    setShowExplanation(true);
  };

  const getOptionClass = (index: number) => {
    if (selectedAnswer === null) return 'border-gray-200 hover:border-gray-300';
    if (index === question.correctAnswer) return 'border-green-500 bg-green-50';
    if (index === selectedAnswer) return 'border-red-500 bg-red-50';
    return 'border-gray-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="px-3 py-1 bg-gray-100 text-gray-900 rounded-full text-sm">
          {question.subject || 'No Subject'}
        </span>
        <div className="flex gap-2">
          {question.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-50 text-gray-900 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <h3 className="text-lg font-medium mb-4 text-gray-900">{question.question}</h3>
      
      <div className="space-y-2 mb-4">
        {question.options.map((option, i) => (
          <div
            key={i}
            className={`p-3 border rounded-lg ${
              i === question.correctAnswer
                ? 'border-green-500 bg-green-50 text-gray-900'
                : 'border-gray-200 text-gray-900'
            }`}
          >
            <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {option}
          </div>
        ))}
      </div>

      {showExplanation && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Explanation</h3>
          <p className="text-gray-700 mb-6">{question.explanation}</p>
          {onNext && (
            <button
              onClick={onNext}
              className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Next Question
            </button>
          )}
        </div>
      )}
    </div>
  );
} 