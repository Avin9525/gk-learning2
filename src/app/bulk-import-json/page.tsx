'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createQuestion } from '@/lib/appwrite';
import { Question } from '@/types';

interface JsonQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  subject?: string;
  tags?: string[];
}

export default function BulkImportJsonPage() {
  const router = useRouter();
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<JsonQuestion[] | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [subject, setSubject] = useState('');
  const [tags, setTags] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [showNewSubjectInput, setShowNewSubjectInput] = useState(false);
  const [editableQuestions, setEditableQuestions] = useState<JsonQuestion[] | null>(null);

  // Function to clean input text
  const cleanInputText = (text: string): string => {
    // Remove any HTML-like content
    if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('<?xml')) {
      // Try to extract JSON content from the text
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return jsonMatch[0];
      }
      return '';
    }
    return text;
  };

  useEffect(() => {
    // Fetch available subjects and tags
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/subjects-and-tags');
        if (!response.ok) {
          throw new Error('Failed to fetch subjects and tags');
        }
        const data = await response.json();
        setAvailableSubjects(data.subjects || []);
        setAvailableTags(data.tags || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching subjects and tags:', error);
        setError('Failed to load available subjects and tags. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleAddNewSubject = () => {
    if (newSubject.trim() && !availableSubjects.includes(newSubject.trim())) {
      setAvailableSubjects([...availableSubjects, newSubject.trim()]);
      setSubject(newSubject.trim());
      setNewSubject('');
      setShowNewSubjectInput(false);
    }
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTags(value);
    
    // Check if the last character is a comma
    if (value.endsWith(',')) {
      const newTag = value.slice(0, -1).trim();
      if (newTag && !availableTags.includes(newTag)) {
        setAvailableTags([...availableTags, newTag]);
      }
    }
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonText(e.target.value);
    setError(null);
    setSuccess(null);
    setPreview(null);
    setEditableQuestions(null);
    setImportedCount(0);
  };

  const handlePreview = () => {
    try {
      if (!jsonText.trim()) {
        setError('Please enter JSON text');
        return;
      }

      if (!subject) {
        setError('Please select a subject');
        return;
      }

      // Clean the input text
      const cleanedText = cleanInputText(jsonText);
      if (!cleanedText) {
        setError('Could not find valid JSON data in the input. Please make sure you are pasting valid JSON.');
        return;
      }

      let jsonContent;
      try {
        jsonContent = JSON.parse(cleanedText);
      } catch (parseError) {
        setError('Invalid JSON format. Please check your text and ensure it is valid JSON.');
        console.error('JSON parse error:', parseError);
        return;
      }
      
      // Validate JSON structure
      if (!Array.isArray(jsonContent)) {
        setError('The JSON text must contain an array of questions');
        return;
      }
      
      // Validate each question
      const validQuestions = jsonContent.filter((q: any) => {
        return (
          typeof q.question === 'string' &&
          Array.isArray(q.options) &&
          q.options.length >= 2 &&
          typeof q.correctAnswer === 'number' &&
          q.correctAnswer >= 0 &&
          q.correctAnswer < q.options.length
        );
      });
      
      if (validQuestions.length === 0) {
        setError('No valid questions found in the JSON text');
        return;
      }
      
      // Add default subject and tags to each question
      const questionsWithDefaults = validQuestions.map(q => ({
        ...q,
        subject: subject,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      }));
      
      setPreview(validQuestions);
      setEditableQuestions(questionsWithDefaults);
    } catch (error) {
      setError('An unexpected error occurred. Please check your input and try again.');
      console.error('Error processing JSON:', error);
    }
  };

  const handleImport = async () => {
    if (!editableQuestions || !subject) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    setImportedCount(0);
    
    try {
      let count = 0;
      
      for (const question of editableQuestions) {
        try {
          await createQuestion({
            question: question.question,
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation || '',
            subject: question.subject || subject,
            tags: question.tags || tags.split(',').map(tag => tag.trim()).filter(tag => tag)
          });
          count++;
          setImportedCount(count);
        } catch (error) {
          console.error('Error importing question:', error);
        }
      }
      
      setSuccess(`Successfully imported ${count} questions`);
      setPreview(null);
      setEditableQuestions(null);
      setJsonText('');
    } catch (error) {
      console.error('Error importing questions:', error);
      setError('Failed to import questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionChange = (index: number, field: keyof JsonQuestion, value: any) => {
    if (!editableQuestions) return;
    
    const updatedQuestions = [...editableQuestions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    
    setEditableQuestions(updatedQuestions);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    if (!editableQuestions) return;
    
    const updatedQuestions = [...editableQuestions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    
    setEditableQuestions(updatedQuestions);
  };

  const handleCorrectAnswerChange = (questionIndex: number, value: number) => {
    if (!editableQuestions) return;
    
    const updatedQuestions = [...editableQuestions];
    updatedQuestions[questionIndex].correctAnswer = value;
    
    setEditableQuestions(updatedQuestions);
  };

  const handleExplanationChange = (questionIndex: number, value: string) => {
    if (!editableQuestions) return;
    
    const updatedQuestions = [...editableQuestions];
    updatedQuestions[questionIndex].explanation = value;
    
    setEditableQuestions(updatedQuestions);
  };

  const handleSubjectChange = (questionIndex: number, value: string) => {
    if (!editableQuestions) return;
    
    const updatedQuestions = [...editableQuestions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      subject: value
    };
    
    setEditableQuestions(updatedQuestions);
  };

  const handleTagsChange = (questionIndex: number, value: string) => {
    if (!editableQuestions) return;
    
    const updatedQuestions = [...editableQuestions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      tags: value.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    
    setEditableQuestions(updatedQuestions);
  };

  const handleTagClick = (questionIndex: number, tag: string) => {
    if (!editableQuestions) return;
    
    const updatedQuestions = [...editableQuestions];
    const currentTags = updatedQuestions[questionIndex].tags || [];
    
    if (currentTags.includes(tag)) {
      // Remove tag if it already exists
      updatedQuestions[questionIndex].tags = currentTags.filter(t => t !== tag);
    } else {
      // Add tag if it doesn't exist
      updatedQuestions[questionIndex].tags = [...currentTags, tag];
    }
    
    setEditableQuestions(updatedQuestions);
  };

  const handleDeleteQuestion = (index: number) => {
    if (!editableQuestions) return;
    
    const updatedQuestions = [...editableQuestions];
    updatedQuestions.splice(index, 1);
    
    if (updatedQuestions.length === 0) {
      setEditableQuestions(null);
    } else {
      setEditableQuestions(updatedQuestions);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">Bulk Import Questions (JSON)</h1>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Subject
                </label>
                {showNewSubjectInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="Enter new subject"
                      className="flex-1 p-2 border border-gray-200 rounded-lg text-gray-900"
                    />
                    <button
                      onClick={handleAddNewSubject}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-gray-900"
                    >
                      <option value="">Select Subject</option>
                      {availableSubjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowNewSubjectInput(true)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add New Subject
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Tags (comma separated)
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={tags}
                    onChange={handleTagChange}
                    placeholder="e.g. math, algebra, equations"
                    className="w-full p-2 border border-gray-200 rounded-lg text-gray-900"
                  />
                  {availableTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-900 rounded-full text-xs cursor-pointer hover:bg-gray-200"
                          onClick={() => {
                            const currentTags = tags.split(',').map(t => t.trim()).filter(t => t);
                            if (!currentTags.includes(tag)) {
                              setTags(currentTags.length ? `${tags}, ${tag}` : tag);
                            }
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Paste JSON Text
              </label>
              <textarea
                value={jsonText}
                onChange={handleJsonChange}
                placeholder="Paste your JSON text here..."
                className="w-full h-64 p-3 border border-gray-200 rounded-lg text-gray-900 font-mono text-sm"
              />
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">JSON Format</h2>
              <p className="text-sm text-gray-600 mb-4">
                Your JSON text should contain an array of question objects with the following structure:
              </p>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm text-gray-800">
{`[
  {
    "question": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswer": 2,
    "explanation": "Paris is the capital city of France."
  },
  {
    "question": "Which planet is known as the Red Planet?",
    "options": ["Venus", "Mars", "Jupiter", "Saturn"],
    "correctAnswer": 1,
    "explanation": "Mars is called the Red Planet due to its reddish appearance."
  }
]`}
              </pre>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-lg">
                {success}
              </div>
            )}
            
            {loading && (
              <div className="mb-6">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
                  <span className="ml-2 text-gray-900">Importing questions... ({importedCount} imported)</span>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handlePreview}
                disabled={!jsonText || loading}
                className={`px-4 py-2 text-white rounded-lg mr-2 ${
                  !jsonText || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Preview
              </button>
              <button
                onClick={handleImport}
                disabled={!editableQuestions || !subject || loading}
                className={`px-4 py-2 text-white rounded-lg ${
                  !editableQuestions || !subject || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 hover:bg-gray-800'
                }`}
              >
                Import Questions
              </button>
            </div>
          </div>
          
          {editableQuestions && editableQuestions.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Preview ({editableQuestions.length} questions)</h2>
              
              <div className="space-y-6">
                {editableQuestions.map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                    <button
                      onClick={() => handleDeleteQuestion(index)}
                      className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
                      title="Delete question"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <select
                          value={question.subject || subject}
                          onChange={(e) => handleSubjectChange(index, e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded-lg text-gray-900"
                        >
                          <option value="">Select Subject</option>
                          {availableSubjects.map((subject) => (
                            <option key={subject} value={subject}>
                              {subject}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={question.tags ? question.tags.join(', ') : tags}
                            onChange={(e) => handleTagsChange(index, e.target.value)}
                            placeholder="e.g. math, algebra, equations"
                            className="w-full p-2 border border-gray-200 rounded-lg text-gray-900"
                          />
                          
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Available tags:</p>
                            <div className="flex flex-wrap gap-1">
                              {availableTags.map((tag) => (
                                <span
                                  key={tag}
                                  onClick={() => handleTagClick(index, tag)}
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs cursor-pointer ${
                                    (question.tags || []).includes(tag)
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg text-gray-900"
                      />
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${index}`}
                            checked={question.correctAnswer === optionIndex}
                            onChange={() => handleCorrectAnswerChange(index, optionIndex)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(index, optionIndex, e.target.value)}
                            className={`flex-1 p-2 rounded-lg border ${
                              question.correctAnswer === optionIndex
                                ? 'border-green-500 bg-green-50 text-gray-900'
                                : 'border-gray-200 text-gray-900'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                      <textarea
                        value={question.explanation || ''}
                        onChange={(e) => handleExplanationChange(index, e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg text-gray-900"
                        rows={2}
                      />
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(question.tags || tags.split(',').map(tag => tag.trim()).filter(tag => tag)).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-900 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 