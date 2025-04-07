'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getQuestions, 
  getQuestionsForTest, 
  getQuestionsBySubject, 
  getQuestionsByTags,
  getQuestionsBySubjectAndTags,
  createProgress,
  updateProgress,
  getProgressByQuestionId,
  calculateNextReview,
  calculateMasteryLevel
} from '@/lib/appwrite';
import { Question, Progress } from '@/types';

export default function TestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
  const [testResults, setTestResults] = useState({
    total: 0,
    correct: 0,
    incorrect: 0,
    score: 0,
  });
  
  // Test configuration
  const [subjects, setSubjects] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [includeNewQuestions, setIncludeNewQuestions] = useState(true);
  const [showConfig, setShowConfig] = useState(true);
  
  // Mock user ID (in a real app, this would come from authentication)
  const userId = 'user123';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch subjects and tags from the API
        const response = await fetch('/api/subjects-and-tags');
        if (!response.ok) {
          throw new Error('Failed to fetch subjects and tags');
        }
        const data = await response.json();
        setAvailableSubjects(data.subjects || []);
        setAvailableTags(data.tags || []);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load available subjects and tags. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const startTest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let questionsResponse;
      
      if (subjects.length > 0 && tags.length > 0) {
        // Filter by both subject and tags
        questionsResponse = await getQuestionsBySubjectAndTags(subjects[0], tags);
      } else if (subjects.length > 0) {
        // Filter by subject only
        questionsResponse = await getQuestionsBySubject(subjects[0]);
      } else if (tags.length > 0) {
        // Filter by tags only
        questionsResponse = await getQuestionsByTags(tags);
      } else {
        // Get questions for test with default settings
        questionsResponse = await getQuestionsForTest(
          userId, 
          undefined, 
          undefined, 
          questionCount,
          includeNewQuestions
        );
      }
      
      // Shuffle questions and limit to questionCount
      const shuffledQuestions = questionsResponse.documents
        .sort(() => Math.random() - 0.5)
        .slice(0, questionCount) as Question[];
      
      setQuestions(shuffledQuestions);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setTestComplete(false);
      setShowConfig(false);
      setLoading(false);
    } catch (error) {
      console.error('Error starting test:', error);
      setError('Failed to start test. Please try again later.');
      setLoading(false);
    }
  };

  const handleAnswerSelect = async (answerIndex: number) => {
    if (selectedAnswer !== null) return; // Prevent multiple selections
    
    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === questions[currentQuestionIndex].correctAnswer;
    
    // Update test results
    setTestResults(prev => ({
      ...prev,
      total: prev.total + 1,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      incorrect: isCorrect ? prev.incorrect : prev.incorrect + 1,
      score: Math.round(((isCorrect ? prev.correct + 1 : prev.correct) / (prev.total + 1)) * 100)
    }));
    
    // Show explanation
    setShowExplanation(true);
    
    // Update progress
    try {
      const questionId = questions[currentQuestionIndex].$id;
      const progressResponse = await getProgressByQuestionId(userId, questionId);
      
      if (progressResponse.documents.length > 0) {
        // Update existing progress
        const progress = progressResponse.documents[0] as Progress;
        const updatedProgress = {
          lastReviewed: new Date().toISOString(),
          nextReview: calculateNextReview(progress, isCorrect),
          correctCount: isCorrect ? progress.correctCount + 1 : progress.correctCount,
          incorrectCount: isCorrect ? progress.incorrectCount : progress.incorrectCount + 1,
          totalAttempts: progress.totalAttempts + 1,
          lastAnswerCorrect: isCorrect,
          streakCount: isCorrect ? progress.streakCount + 1 : 0,
          masteryLevel: 0 // Initialize with default value
        };
        
        // Calculate new mastery level
        const newProgress = { ...progress, ...updatedProgress };
        updatedProgress.masteryLevel = calculateMasteryLevel(newProgress);
        
        await updateProgress(progress.$id, updatedProgress);
      } else {
        // Create new progress
        const newProgress = {
          userId,
          questionId,
          lastReviewed: new Date().toISOString(),
          nextReview: calculateNextReview({
            masteryLevel: 0,
            correctCount: isCorrect ? 1 : 0,
            incorrectCount: isCorrect ? 0 : 1,
            totalAttempts: 1,
            streakCount: isCorrect ? 1 : 0,
          } as Progress, isCorrect),
          correctCount: isCorrect ? 1 : 0,
          incorrectCount: isCorrect ? 0 : 1,
          totalAttempts: 1,
          masteryLevel: isCorrect ? 20 : 0,
          reviewCount: 1,
          lastAnswerCorrect: isCorrect,
          streakCount: isCorrect ? 1 : 0,
          difficultyRating: 3,
          notes: '',
        };
        
        await createProgress(newProgress);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setTestComplete(true);
    }
  };

  const restartTest = () => {
    setShowConfig(true);
    setTestResults({
      total: 0,
      correct: 0,
      incorrect: 0,
      score: 0,
    });
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

  if (showConfig) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">MCQ Test Configuration</h1>
          
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Subject
                </label>
                <select
                  value={subjects[0] || ''}
                  onChange={(e) => setSubjects(e.target.value ? [e.target.value] : [])}
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
                  value={tags}
                  onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    setTags(selectedOptions);
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
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Number of Questions
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
                  className="w-full p-2 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeNewQuestions"
                  checked={includeNewQuestions}
                  onChange={(e) => setIncludeNewQuestions(e.target.checked)}
                  className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                />
                <label htmlFor="includeNewQuestions" className="ml-2 block text-sm text-gray-900">
                  Include new questions I haven't seen before
                </label>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button
                onClick={startTest}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Start Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (testComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">Test Complete</h1>
          
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-8">
              <div className="text-5xl font-bold text-gray-900 mb-2">{testResults.score}%</div>
              <p className="text-gray-600">Your score</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-900">{testResults.total}</div>
                <p className="text-gray-600">Total</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{testResults.correct}</div>
                <p className="text-green-600">Correct</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{testResults.incorrect}</div>
                <p className="text-red-600">Incorrect</p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={restartTest}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Take Another Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">MCQ Test</h1>
            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-500 mb-1">
                {currentQuestion.subject}
              </div>
              <h2 className="text-xl font-medium text-gray-900">{currentQuestion.question}</h2>
            </div>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={selectedAnswer !== null}
                  className={`w-full p-4 text-left rounded-lg border transition-all ${
                    selectedAnswer === null
                      ? 'border-gray-200 hover:border-gray-300 text-gray-900'
                      : selectedAnswer === index
                      ? index === currentQuestion.correctAnswer
                        ? 'border-green-500 bg-green-50 text-green-900'
                        : 'border-red-500 bg-red-50 text-red-900'
                      : index === currentQuestion.correctAnswer && selectedAnswer !== null
                      ? 'border-green-500 bg-green-50 text-green-900'
                      : 'border-gray-200 text-gray-900'
                  }`}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </button>
              ))}
            </div>
            
            {showExplanation && currentQuestion.explanation && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Explanation</h3>
                <p className="text-gray-700">{currentQuestion.explanation}</p>
              </div>
            )}
            
            {showExplanation && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleNextQuestion}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Test'}
                </button>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {currentQuestion.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-900 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 