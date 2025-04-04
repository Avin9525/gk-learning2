'use client';

import { useState, useEffect } from 'react';
import { createQuestion, getQuestions } from '@/lib/appwrite';
import { Question } from '@/types';

export default function BulkImport2Page() {
  const [rawContent, setRawContent] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [defaultSubject, setDefaultSubject] = useState('');
  const [defaultTags, setDefaultTags] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [newTag, setNewTag] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'preview' | 'success' | 'error'>('idle');
  const [importStats, setImportStats] = useState({
    total: 0,
    valid: 0,
    invalid: 0,
  });

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const questions = await getQuestions();
        // Extract unique subjects
        const subjects = [...new Set(questions.documents.map((q) => (q as Question).subject).filter(Boolean))] as string[];
        setAvailableSubjects(subjects);
        
        // Extract unique tags
        const tags = [...new Set(questions.documents.flatMap((q) => (q as Question).tags))] as string[];
        setAvailableTags(tags);
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    };

    fetchQuestions();
  }, []);

  const parseQuestions = () => {
    try {
      const lines = rawContent.split('\n').filter(line => line.trim() !== '');
      const parsedQuestions: Question[] = [];
      let currentQuestion: Partial<Question> = {};
      let currentOptions: string[] = [];
      let currentCorrectAnswer = -1;
      let currentExplanation = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('Q.')) {
          // If we have a previous question, save it
          if (currentQuestion.question && currentOptions.length === 4 && currentCorrectAnswer !== -1) {
            parsedQuestions.push({
              $id: `q-${parsedQuestions.length}`,
              $collectionId: process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID!,
              $databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
              $createdAt: new Date().toISOString(),
              $updatedAt: new Date().toISOString(),
              $permissions: [],
              question: currentQuestion.question,
              options: currentOptions,
              correctAnswer: currentCorrectAnswer,
              explanation: currentExplanation,
              tags: defaultTags ? defaultTags.split(',').map(tag => tag.trim()) : [],
              subject: defaultSubject,
            });
          }

          // Start new question
          currentQuestion = {
            question: line.substring(2).trim(),
          };
          currentOptions = [];
          currentCorrectAnswer = -1;
          currentExplanation = '';
        } else if (line.startsWith('A).') || line.startsWith('B).') || line.startsWith('C).') || line.startsWith('D).')) {
          const optionText = line.substring(3).trim();
          const optionIndex = line.charAt(0).charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
          currentOptions[optionIndex] = optionText;

          // Check if this is the correct answer
          if (line.includes('(correct)')) {
            currentCorrectAnswer = optionIndex;
            currentOptions[optionIndex] = optionText.replace('(correct)', '').trim();
          }
        } else if (line.startsWith('exp.')) {
          // Handle explanation
          currentExplanation = line.substring(4).trim();
        }
      }

      // Add the last question if exists
      if (currentQuestion.question && currentOptions.length === 4 && currentCorrectAnswer !== -1) {
        parsedQuestions.push({
          $id: `q-${parsedQuestions.length}`,
          $collectionId: process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID!,
          $databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString(),
          $permissions: [],
          question: currentQuestion.question,
          options: currentOptions,
          correctAnswer: currentCorrectAnswer,
          explanation: currentExplanation,
          tags: defaultTags ? defaultTags.split(',').map(tag => tag.trim()) : [],
          subject: defaultSubject,
        });
      }

      setQuestions(parsedQuestions);
      setImportStatus('preview');
      setImportStats({
        total: parsedQuestions.length,
        valid: parsedQuestions.length,
        invalid: 0,
      });
    } catch (error) {
      setImportStatus('error');
      console.error('Error parsing questions:', error);
    }
  };

  const handleImport = async () => {
    try {
      for (const question of questions) {
        await createQuestion({
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          tags: question.tags,
          subject: question.subject,
        });
      }
      setImportStatus('success');
      setTimeout(() => {
        setRawContent('');
        setQuestions([]);
        setImportStatus('idle');
      }, 3000);
    } catch (error) {
      setImportStatus('error');
      console.error('Error importing questions:', error);
    }
  };

  const resetForm = () => {
    setRawContent('');
    setQuestions([]);
    setImportStatus('idle');
  };

  const handleQuestionChange = (questionId: string, field: string, value: any) => {
    setQuestions(questions.map(q => {
      if (q.$id === questionId) {
        return {
          ...q,
          [field]: value
        };
      }
      return q;
    }));
  };

  const handleOptionChange = (questionId: string, index: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.$id === questionId) {
        const newOptions = [...q.options];
        newOptions[index] = value;
        return {
          ...q,
          options: newOptions
        };
      }
      return q;
    }));
  };

  const handleTagsChange = (questionId: string, tags: string) => {
    setQuestions(questions.map(q => {
      if (q.$id === questionId) {
        return {
          ...q,
          tags: tags.split(',').map(tag => tag.trim())
        };
      }
      return q;
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">Bulk Import Questions (Format 2)</h1>
        
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {importStatus === 'idle' && (
            <>
              <div className="mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Default Subject
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={defaultSubject}
                        onChange={(e) => setDefaultSubject(e.target.value)}
                        className="flex-1 p-2 border border-gray-200 rounded-lg text-gray-900"
                      >
                        <option value="">Select a subject</option>
                        {availableSubjects.map((subject) => (
                          <option key={subject} value={subject}>
                            {subject}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        className="flex-1 p-2 border border-gray-200 rounded-lg text-gray-900"
                        placeholder="New subject"
                      />
                      <button
                        onClick={() => {
                          if (newSubject.trim()) {
                            setAvailableSubjects([...availableSubjects, newSubject.trim()]);
                            setDefaultSubject(newSubject.trim());
                            setNewSubject('');
                          }
                        }}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Default Tags (comma-separated)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            const currentTags = defaultTags ? defaultTags.split(',').map(t => t.trim()) : [];
                            if (!currentTags.includes(e.target.value)) {
                              setDefaultTags([...currentTags, e.target.value].join(', '));
                            }
                          }
                        }}
                        className="flex-1 p-2 border border-gray-200 rounded-lg text-gray-900"
                      >
                        <option value="">Select existing tags</option>
                        {availableTags.map((tag) => (
                          <option key={tag} value={tag}>
                            {tag}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="flex-1 p-2 border border-gray-200 rounded-lg text-gray-900"
                        placeholder="New tag"
                      />
                      <button
                        onClick={() => {
                          if (newTag.trim()) {
                            setAvailableTags([...availableTags, newTag.trim()]);
                            const currentTags = defaultTags ? defaultTags.split(',').map(t => t.trim()) : [];
                            setDefaultTags([...currentTags, newTag.trim()].join(', '));
                            setNewTag('');
                          }
                        }}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                      >
                        Add
                      </button>
                    </div>
                    {defaultTags && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {defaultTags.split(',').map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-900 rounded-full text-sm"
                          >
                            {tag.trim()}
                            <button
                              onClick={() => {
                                const tags = defaultTags.split(',').filter(t => t.trim() !== tag.trim());
                                setDefaultTags(tags.join(', '));
                              }}
                              className="ml-2 text-gray-500 hover:text-gray-900"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Questions
                    </label>
                    <textarea
                      value={rawContent}
                      onChange={(e) => setRawContent(e.target.value)}
                      className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 text-gray-900 bg-white min-h-[300px]"
                      placeholder="Format: Q. Question text\nA). Option 1\nB). Option 2\nC). Option 3 (correct)\nD). Option 4\nexp. Explanation text"
                    />
                    <div className="bg-gray-50 p-4 rounded-lg mt-2">
                      <h3 className="text-sm font-medium mb-2 text-gray-900">Format Instructions:</h3>
                      <ul className="text-sm space-y-1 list-disc pl-5 text-gray-700">
                        <li>Start each question with "Q." followed by the question text</li>
                        <li>List four options labeled A)., B)., C)., D).</li>
                        <li>Add "(correct)" after the correct answer option</li>
                        <li>Add explanation with "exp." prefix (optional)</li>
                        <li>Separate questions with a blank line</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-200 rounded-lg text-gray-900 hover:bg-gray-50"
                >
                  Reset
                </button>
                <button
                  onClick={parseQuestions}
                  disabled={!rawContent.trim()}
                  className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
                >
                  Preview Questions
                </button>
              </div>
            </>
          )}

          {importStatus === 'preview' && (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">Total Questions:</span>{' '}
                    {importStats.total}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div
                    key={question.$id}
                    className="border border-gray-200 rounded-lg p-6 bg-white"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Subject
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={question.subject}
                            onChange={(e) => handleQuestionChange(question.$id, 'subject', e.target.value)}
                            className="flex-1 p-2 border border-gray-200 rounded-lg text-gray-900"
                          >
                            <option value="">Select a subject</option>
                            {availableSubjects.map((subject) => (
                              <option key={subject} value={subject}>
                                {subject}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            className="flex-1 p-2 border border-gray-200 rounded-lg text-gray-900"
                            placeholder="New subject"
                          />
                          <button
                            onClick={() => {
                              if (newSubject.trim()) {
                                setAvailableSubjects([...availableSubjects, newSubject.trim()]);
                                handleQuestionChange(question.$id, 'subject', newSubject.trim());
                                setNewSubject('');
                              }
                            }}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Question
                        </label>
                        <textarea
                          value={question.question}
                          onChange={(e) => handleQuestionChange(question.$id, 'question', e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded-lg text-gray-900 min-h-[100px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Options
                        </label>
                        {question.options.map((option, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <span className="text-gray-900 font-medium w-6">
                              {String.fromCharCode(65 + i)}.
                            </span>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(question.$id, i, e.target.value)}
                              className="flex-1 p-2 border border-gray-200 rounded-lg text-gray-900"
                            />
                            <button
                              onClick={() => handleQuestionChange(question.$id, 'correctAnswer', i)}
                              className={`px-3 py-1 rounded-lg ${
                                i === question.correctAnswer
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              Correct
                            </button>
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Explanation
                        </label>
                        <textarea
                          value={question.explanation}
                          onChange={(e) => handleQuestionChange(question.$id, 'explanation', e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded-lg text-gray-900 min-h-[100px]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Tags
                        </label>
                        <div className="flex gap-2">
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                const currentTags = question.tags;
                                if (!currentTags.includes(e.target.value)) {
                                  handleTagsChange(question.$id, [...currentTags, e.target.value].join(', '));
                                }
                              }
                            }}
                            className="flex-1 p-2 border border-gray-200 rounded-lg text-gray-900"
                          >
                            <option value="">Select existing tags</option>
                            {availableTags.map((tag) => (
                              <option key={tag} value={tag}>
                                {tag}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            className="flex-1 p-2 border border-gray-200 rounded-lg text-gray-900"
                            placeholder="New tag"
                          />
                          <button
                            onClick={() => {
                              if (newTag.trim()) {
                                setAvailableTags([...availableTags, newTag.trim()]);
                                handleTagsChange(question.$id, [...question.tags, newTag.trim()].join(', '));
                                setNewTag('');
                              }
                            }}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                          >
                            Add
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {question.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-900 rounded-full text-sm"
                            >
                              {tag}
                              <button
                                onClick={() => {
                                  const tags = question.tags.filter(t => t !== tag);
                                  handleTagsChange(question.$id, tags.join(', '));
                                }}
                                className="ml-2 text-gray-500 hover:text-gray-900"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-200 rounded-lg text-gray-900 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  Import {importStats.valid} Questions
                </button>
              </div>
            </>
          )}

          {importStatus === 'success' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
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
                  Successfully imported {importStats.valid} questions!
                </p>
              </div>
            </div>
          )}

          {importStatus === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
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
                  There was an error importing the questions. Please check the format and try again.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 