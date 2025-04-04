import { useState } from 'react';
import { createQuestion } from '@/lib/appwrite';

export default function AddQuestionForm() {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    const [correctAnswer, setCorrectAnswer] = useState(0);
    const [explanation, setExplanation] = useState('');
    const [tags, setTags] = useState('');
    const [subject, setSubject] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await createQuestion({
                question,
                options,
                correctAnswer,
                explanation,
                tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                subject
            });

            // Reset form
            setQuestion('');
            setOptions(['', '', '', '']);
            setCorrectAnswer(0);
            setExplanation('');
            setTags('');
            setSubject('');
            alert('Question added successfully!');
        } catch (error) {
            console.error('Error adding question:', error);
            alert('Failed to add question. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">Add New Question</h2>
            
            <div className="mb-6">
                <label className="block text-gray-900 font-medium mb-2">Subject</label>
                <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                    required
                    placeholder="e.g., Mathematics, Physics, etc."
                />
            </div>

            <div className="mb-6">
                <label className="block text-gray-900 font-medium mb-2">Question</label>
                <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                    required
                />
            </div>

            <div className="mb-6">
                <label className="block text-gray-900 font-medium mb-2">Options</label>
                {options.map((option, index) => (
                    <div key={index} className="mb-3">
                        <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                            required
                        />
                    </div>
                ))}
            </div>

            <div className="mb-6">
                <label className="block text-gray-900 font-medium mb-2">Correct Answer</label>
                <select
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(Number(e.target.value))}
                    className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                    required
                >
                    {options.map((_, index) => (
                        <option key={index} value={index}>
                            Option {index + 1}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-6">
                <label className="block text-gray-900 font-medium mb-2">Explanation</label>
                <textarea
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                    required
                />
            </div>

            <div className="mb-6">
                <label className="block text-gray-900 font-medium mb-2">Tags (comma-separated)</label>
                <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                    placeholder="e.g., algebra, geometry, calculus"
                />
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200 disabled:bg-gray-400"
            >
                {isSubmitting ? 'Adding...' : 'Add Question'}
            </button>
        </form>
    );
} 