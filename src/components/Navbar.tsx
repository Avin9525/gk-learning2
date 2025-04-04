'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname === path;
    };

    return (
        <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/" className="text-xl font-bold text-gray-900">
                                Space Repetition
                            </Link>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                href="/"
                                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                                    isActive('/')
                                        ? 'border-gray-900 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                            >
                                Home
                            </Link>
                            <Link
                                href="/add-question"
                                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                                    isActive('/add-question')
                                        ? 'border-gray-900 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                            >
                                Add Question
                            </Link>
                            <Link
                                href="/bulk-import"
                                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                                    isActive('/bulk-import')
                                        ? 'border-gray-900 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                            >
                                Bulk Import
                            </Link>
                            <Link
                                href="/bulk-import-2"
                                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                                    isActive('/bulk-import-2')
                                        ? 'border-gray-900 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                            >
                                Bulk Import 2
                            </Link>
                            <Link
                                href="/test"
                                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                                    isActive('/test')
                                        ? 'border-gray-900 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                            >
                                Take Test
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className="sm:hidden">
                <div className="px-4 py-2 space-y-1">
                    <Link
                        href="/"
                        className={`block px-3 py-2 rounded-md text-base font-medium ${
                            isActive('/')
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        Home
                    </Link>
                    <Link
                        href="/add-question"
                        className={`block px-3 py-2 rounded-md text-base font-medium ${
                            isActive('/add-question')
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        Add Question
                    </Link>
                    <Link
                        href="/bulk-import"
                        className={`block px-3 py-2 rounded-md text-base font-medium ${
                            isActive('/bulk-import')
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        Bulk Import
                    </Link>
                    <Link
                        href="/bulk-import-2"
                        className={`block px-3 py-2 rounded-md text-base font-medium ${
                            isActive('/bulk-import-2')
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        Bulk Import 2
                    </Link>
                    <Link
                        href="/test"
                        className={`block px-3 py-2 rounded-md text-base font-medium ${
                            isActive('/test')
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        Take Test
                    </Link>
                </div>
            </div>
        </nav>
    );
} 