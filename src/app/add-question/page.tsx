'use client';

import { useState } from 'react';
import { createQuestion } from '@/lib/appwrite';
import { Question } from '@/types';

export default function AddQuestionPage() {
  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    tags: '',
    subject: '',
  });
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createQuestion({
        question: formData.question,
        options: formData.options,
        correctAnswer: formData.correctAnswer,
        explanation: formData.explanation,
        tags: formData.tags.split(',').map(tag => tag.trim()),
        subject: formData.subject,
      });
      setStatus('success');
      setFormData({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        tags: '',
        subject: '',
      });
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      setStatus('error');
      console.error('Error creating question:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">Add New Question</h1>
        
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-900 mb-1">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 text-gray-900"
                placeholder="e.g., Mathematics"
                required
              />
            </div>

            <div>
              <label htmlFor="question" className="block text-sm font-medium text-gray-900 mb-1">
                Question
              </label>
              <textarea
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 text-gray-900 min-h-[100px]"
                placeholder="Enter your question here"
                required
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Options
              </label>
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <span className="text-gray-900 font-medium w-6">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...formData.options];
                      newOptions[index] = e.target.value;
                      setFormData({ ...formData, options: newOptions });
                    }}
                    className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 text-gray-900"
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    required
                  />
                </div>
              ))}
            </div>

            <div>
              <label htmlFor="correctAnswer" className="block text-sm font-medium text-gray-900 mb-1">
                Correct Answer
              </label>
              <select
                id="correctAnswer"
                value={formData.correctAnswer}
                onChange={(e) => setFormData({ ...formData, correctAnswer: parseInt(e.target.value) })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 text-gray-900"
                required
              >
                {formData.options.map((_, index) => (
                  <option key={index} value={index}>
                    {String.fromCharCode(65 + index)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="explanation" className="block text-sm font-medium text-gray-900 mb-1">
                Explanation
              </label>
              <textarea
                id="explanation"
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 text-gray-900 min-h-[100px]"
                placeholder="Explain why this is the correct answer"
              />
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-900 mb-1">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 text-gray-900"
                placeholder="e.g., algebra, geometry, calculus"
              />
              <p className="mt-1 text-sm text-gray-500">
                Separate tags with commas
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Add Question
              </button>
            </div>
          </form>

          {status === 'success' && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-green-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-green-900">
                  Question added successfully!
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-red-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-red-900">
                  There was an error adding the question. Please try again.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 