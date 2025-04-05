'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getQuestions, 
  getQuestionsBySubject, 
  getQuestionsByTags,
  getQuestionsBySubjectAndTags,
  deleteQuestion 
} from '@/lib/appwrite';
import { Question } from '@/types';

export default function ManageQuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const questionsResponse = await getQuestions();
      
      // Extract unique subjects and tags
      const subjects = [...new Set(questionsResponse.documents.map((q: any) => q.subject).filter(Boolean))] as string[];
      setAvailableSubjects(subjects);
      
      const allTags = questionsResponse.documents.flatMap((q: any) => q.tags || []);
      const uniqueTags = [...new Set(allTags)] as string[];
      setAvailableTags(uniqueTags);
      
      setQuestions(questionsResponse.documents as Question[]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load questions. Please try again later.');
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    try {
      setLoading(true);
      let filteredQuestions;
      
      if (selectedSubject && selectedTags.length > 0) {
        filteredQuestions = await getQuestionsBySubjectAndTags(selectedSubject, selectedTags);
      } else if (selectedSubject) {
        filteredQuestions = await getQuestionsBySubject(selectedSubject);
      } else if (selectedTags.length > 0) {
        filteredQuestions = await getQuestionsByTags(selectedTags);
      } else {
        filteredQuestions = await getQuestions();
      }
      
      setQuestions(filteredQuestions.documents as Question[]);
      setLoading(false);
    } catch (error) {
      console.error('Error filtering questions:', error);
      setError('Failed to filter questions. Please try again later.');
      setLoading(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      await deleteQuestion(questionId);
      setQuestions(questions.filter(q => q.$id !== questionId));
    } catch (error) {
      console.error('Error deleting question:', error);
      setError('Failed to delete question. Please try again later.');
    }
  };

  const handleEdit = (questionId: string) => {
    router.push(`/edit-question/${questionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-900">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <p className="text-gray-900">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Manage Questions</h1>
            <button
              onClick={() => router.push('/add-question')}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Add New Question
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg text-gray-900"
                >
                  <option value="">All Subjects</option>
                  {availableSubjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Tags
                </label>
                <select
                  multiple
                  value={selectedTags}
                  onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    setSelectedTags(selectedOptions);
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg text-gray-900 min-h-[100px]"
                >
                  {availableTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple tags</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleFilter}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Apply Filters
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((question) => (
              <div
                key={question.$id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      {question.subject}
                    </div>
                    <h2 className="text-xl font-medium text-gray-900">{question.question}</h2>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(question.$id)}
                      className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(question.$id)}
                      className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {question.options.map((option, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        index === question.correctAnswer
                          ? 'border-green-500 bg-green-50 text-gray-900'
                          : 'border-gray-200 text-gray-900'
                      }`}
                    >
                      <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                      {option}
                    </div>
                  ))}
                </div>

                {question.explanation && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Explanation</h3>
                    <p className="text-gray-700">{question.explanation}</p>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {question.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-900 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 