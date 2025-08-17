
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Article, Category, Author, NewArticleData, User, View, Event, EventType } from './types';
import { MOCK_ARTICLES, CATEGORIES, MOCK_AUTHORS, MOCK_USERS, MOCK_EVENTS, EVENT_CATEGORIES } from './constants';
import Header from './components/Header';
import FilterTabs from './components/FilterTabs';
import ArticleGrid from './components/ArticleGrid';
import ArticleDetail from './components/ArticleDetail';
import NewsletterSubscription from './components/NewsletterSubscription';
import Toast from './components/Toast';
import ArticleEditor from './components/ArticleEditor';
import UpgradeRequestModal from './components/UpgradeRequestModal';
import AuthorWelcomeModal from './components/AuthorWelcomeModal';
import EventsPage from './components/EventsPage';
import EventDetail from './components/EventDetail';

const App: React.FC = () => {
    // --- Global State ---
    const [currentView, setCurrentView] = useState<View>(View.Articles);
    
    // --- Article State ---
    const [articles, setArticles] = useState<Article[]>(() => {
        try {
            const storedArticles = window.localStorage.getItem('cultural-articles');
            return storedArticles ? JSON.parse(storedArticles) : MOCK_ARTICLES;
        } catch (error) {
            console.error("Error reading articles from localStorage", error);
            return MOCK_ARTICLES;
        }
    });
    const [authors] = useState<Author[]>(MOCK_AUTHORS);
    const [activeFilter, setActiveFilter] = useState<Category>(Category.All);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState<number>(12);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [savedArticleIds, setSavedArticleIds] = useState<Set<number>>(() => {
        try {
            const item = window.localStorage.getItem('savedArticles');
            return item ? new Set(JSON.parse(item)) : new Set();
        } catch (error)
        {
            console.error("Error reading from localStorage", error);
            return new Set();
        }
    });
    
    // --- Event State ---
    const [events] = useState<Event[]>(MOCK_EVENTS);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [activeEventFilter, setActiveEventFilter] = useState<EventType>(EventType.All);


    // --- UI & User State ---
    const [toastMessage, setToastMessage] = useState('');
    const toastTimerRef = useRef<number | null>(null);
    const [isSticky, setIsSticky] = useState(false);
    const filterPlaceholderRef = useRef<HTMLDivElement>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userCycleIndex, setUserCycleIndex] = useState(0);
    const [authorWelcome, setAuthorWelcome] = useState<{ show: boolean; name: string }>({ show: false, name: '' });


    const showToast = useCallback((message: string) => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }
        setToastMessage(message);
        toastTimerRef.current = window.setTimeout(() => {
            setToastMessage('');
        }, 3000);
    }, []);

    const handleAuthCycle = useCallback(() => {
        const cycle = [null, ...MOCK_USERS]; // null for logged out state
        const nextIndex = (userCycleIndex + 1) % cycle.length;
        const nextUser = cycle[nextIndex];
        setCurrentUser(nextUser);
        setUserCycleIndex(nextIndex);
        
        if (nextUser) {
            if (nextUser.isAuthor) {
                setAuthorWelcome({ show: true, name: nextUser.name });
            } else {
                showToast(`خوش آمدید ${nextUser.name}`);
            }
        } else {
            showToast('شما از حساب کاربری خارج شدید');
        }
    }, [userCycleIndex, showToast]);

    useEffect(() => {
        try {
            window.localStorage.setItem('cultural-articles', JSON.stringify(articles));
        } catch (error) {
            console.error("Error writing articles to localStorage", error);
        }
    }, [articles]);

     useEffect(() => {
        try {
            window.localStorage.setItem('savedArticles', JSON.stringify(Array.from(savedArticleIds)));
        } catch (error) {
            console.error("Error writing to localStorage", error);
        }
    }, [savedArticleIds]);

    const handleToggleSave = useCallback((articleId: number) => {
        const newSavedIds = new Set(savedArticleIds);
        let message = '';
        if (newSavedIds.has(articleId)) {
            newSavedIds.delete(articleId);
            message = 'مقاله از ذخیره شده‌ها حذف شد';
        } else {
            newSavedIds.add(articleId);
            message = 'مقاله ذخیره شد';
        }
        setSavedArticleIds(newSavedIds);
        showToast(message);
    }, [savedArticleIds, showToast]);

    const handleOpenEditor = () => {
        if (currentUser?.isAuthor) {
            setIsEditorOpen(true);
        } else {
            setIsUpgradeModalOpen(true);
        }
    };
    const handleCloseEditor = () => setIsEditorOpen(false);
    const handleCloseUpgradeModal = () => setIsUpgradeModalOpen(false);


    const handlePublishArticle = useCallback((data: NewArticleData) => {
        const newArticle: Article = {
            ...data,
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            views: '۰',
            likes: '۰',
            language: 'fa',
            tags: [],
        };
        setArticles(prevArticles => [newArticle, ...prevArticles]);
        setCurrentView(View.Articles);
        showToast('مقاله با موفقیت منتشر شد!');
    }, [showToast]);

    useEffect(() => {
        const placeholder = filterPlaceholderRef.current;
        if (!placeholder) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsSticky(entry.boundingClientRect.top < 0 && currentView === View.Articles);
            },
            { threshold: [0] }
        );

        observer.observe(placeholder);

        return () => {
            if (placeholder) {
                observer.unobserve(placeholder);
            }
        };
    }, [currentView]);

    useEffect(() => {
        const isModalOpen = selectedArticle || isEditorOpen || isUpgradeModalOpen || authorWelcome.show || selectedEvent;
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
             document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [selectedArticle, isEditorOpen, isUpgradeModalOpen, authorWelcome.show, selectedEvent]);
    
    const handleArticleSelect = (article: Article) => {
        setSelectedArticle(article);
        setSearchTerm('');
    };
    
    const handleEventSelect = (event: Event) => {
        setSelectedEvent(event);
    };

    const handleTagSelect = useCallback((tag: string) => {
        setActiveFilter(Category.All);
        setSearchTerm('');
        setActiveTag(tag);
        setCurrentView(View.Articles);
        setSelectedArticle(null); // Close detail view to see results
    }, []);

    const handleFilterChange = (filter: Category) => {
        setActiveFilter(filter);
        setActiveTag(null);
    };

    const filteredArticles = useMemo(() => {
        let results = articles;

        if (activeFilter === Category.Saved) {
            results = articles.filter(article => savedArticleIds.has(article.id));
        }

        if (searchTerm && currentView === View.Articles) {
            const lowercasedTerm = searchTerm.toLowerCase();
            let searchResults = (activeFilter === Category.Saved ? results : articles);
            results = searchResults.filter(article => 
                article.title.toLowerCase().includes(lowercasedTerm) || 
                article.excerpt.toLowerCase().includes(lowercasedTerm)
            );
             // If search is active, don't apply other filters unless it's 'Saved'
            if (activeFilter !== Category.Saved) return results;
        }

        if (activeFilter === Category.Saved) {
            return results; // Already filtered and searched
        }
        
        if (activeTag) {
            results = articles.filter(article => article.tags?.includes(activeTag));
        } 
        else if (activeFilter !== Category.All) {
            results = articles.filter(article => article.category === activeFilter);
        }

        return results;

    }, [articles, activeFilter, searchTerm, savedArticleIds, activeTag, currentView]);
    
    useEffect(() => {
        setVisibleCount(12);
    }, [activeFilter, searchTerm, activeTag]);

    const articlesToShow = useMemo(() => {
        return filteredArticles.slice(0, visibleCount);
    }, [filteredArticles, visibleCount]);

    const loadMore = useCallback(() => {
        setTimeout(() => {
            setVisibleCount(prevCount => prevCount + 8);
        }, 300);
    }, []);

    const hasMore = visibleCount < filteredArticles.length;

    const observer = useRef<IntersectionObserver | null>(null);
    const loaderRef = useCallback(node => {
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMore();
            }
        });
        if (node) observer.current.observe(node);
    }, [hasMore, loadMore]);
    
    const selectedArticleAuthor = useMemo(() => {
        if (!selectedArticle) return undefined;
        return authors.find(author => author.id === selectedArticle.authorId);
    }, [selectedArticle, authors]);
    
    const currentAuthorProfile = useMemo(() => {
        if (currentUser?.isAuthor && currentUser.authorId) {
            return authors.find(author => author.id === currentUser.authorId);
        }
        return undefined;
    }, [currentUser, authors]);
    
    const filteredEvents = useMemo(() => {
        if (activeEventFilter === EventType.All) {
            return events;
        }
        return events.filter(event => event.eventType === activeEventFilter);
    }, [events, activeEventFilter]);

    return (
        <div className="min-h-screen text-white">
            <div className="bg-gray-900/80 backdrop-blur-lg">
                 <Header 
                    searchTerm={searchTerm} 
                    setSearchTerm={setSearchTerm} 
                    onOpenEditor={handleOpenEditor}
                    currentUser={currentUser}
                    onAuthCycle={handleAuthCycle}
                    currentView={currentView}
                    setCurrentView={setCurrentView}
                />
            </div>
           
            <div ref={filterPlaceholderRef} className="relative h-[69px]">
                {currentView === View.Articles && (
                    <FilterTabs 
                        categories={CATEGORIES} 
                        activeFilter={activeFilter} 
                        setActiveFilter={handleFilterChange} 
                        isSticky={isSticky}
                    />
                )}
            </div>
            
            <main className="container mx-auto px-1.5 sm:px-2 lg:px-3 py-8">
                {currentView === View.Articles ? (
                    <>
                        {activeTag && (
                            <div className="mb-6">
                                <div className="inline-flex items-center gap-3 bg-gray-800/60 text-gray-200 text-sm font-medium px-4 py-2 rounded-full border border-gray-700">
                                    <span>فیلتر بر اساس تگ:</span>
                                    <span className="font-bold text-fuchsia-400 text-base">{activeTag}</span>
                                    <button 
                                        onClick={() => setActiveTag(null)} 
                                        className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-700 hover:bg-red-500/80 text-white transition-colors"
                                        aria-label={`حذف فیلتر ${activeTag}`}
                                    >
                                        &#x2715;
                                    </button>
                                </div>
                            </div>
                        )}

                        <ArticleGrid 
                            articles={articlesToShow} 
                            authors={authors}
                            onArticleSelect={handleArticleSelect} 
                            selectedArticleId={selectedArticle?.id}
                            savedArticleIds={savedArticleIds}
                            onToggleSave={handleToggleSave}
                        />
                        
                        <div ref={loaderRef} className="h-20 flex justify-center items-center">
                            {hasMore && (
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-500"></div>
                            )}
                        </div>

                        {filteredArticles.length === 0 && (searchTerm !== '' || activeTag) && (
                            <div className="text-center mt-12 py-16">
                                <h2 className="text-2xl font-bold text-gray-400">مقاله‌ای یافت نشد</h2>
                                <p className="text-gray-500 mt-2">لطفاً فیلتر یا عبارت جستجوی خود را تغییر دهید.</p>
                            </div>
                        )}

                        {filteredArticles.length === 0 && searchTerm === '' && !activeTag && activeFilter === Category.Saved && (
                            <div className="text-center mt-12 py-16">
                                <h2 className="text-2xl font-bold text-gray-400">هنوز مقاله‌ای ذخیره نکرده‌اید</h2>
                                <p className="text-gray-500 mt-2">مقاله‌های مورد علاقه خود را با کلیک روی آیکون بوکمارک ذخیره کنید.</p>
                            </div>
                        )}
                    </>
                ) : (
                    <EventsPage 
                        events={filteredEvents}
                        onEventSelect={handleEventSelect}
                        categories={EVENT_CATEGORIES}
                        activeFilter={activeEventFilter}
                        setActiveFilter={setActiveEventFilter}
                    />
                )}
            </main>

            <div className="container mx-auto px-1.5 sm:px-2 lg:px-3 pb-8">
                <NewsletterSubscription />
            </div>

            <footer className="text-center py-8 text-gray-600 text-sm">
                <p>&copy; {new Date().getFullYear()} مرکز فرهنگی هنری. تمام حقوق محفوظ است.</p>
            </footer>

            {selectedArticle && (
                <ArticleDetail 
                    article={selectedArticle} 
                    author={selectedArticleAuthor}
                    onClose={() => setSelectedArticle(null)} 
                    isSaved={savedArticleIds.has(selectedArticle.id)}
                    onToggleSave={handleToggleSave}
                    allArticles={articles}
                    onSelectRelated={handleArticleSelect}
                    currentUser={currentUser}
                    onTagSelect={handleTagSelect}
                />
            )}
            
            {selectedEvent && (
                <EventDetail
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                />
            )}

            {isEditorOpen && currentAuthorProfile && (
                <ArticleEditor
                    author={currentAuthorProfile}
                    onClose={handleCloseEditor}
                    onPublish={handlePublishArticle}
                />
            )}

            {isUpgradeModalOpen && (
                <UpgradeRequestModal
                    onClose={handleCloseUpgradeModal}
                    isLoggedIn={!!currentUser}
                />
            )}

            {authorWelcome.show && (
                <AuthorWelcomeModal 
                    show={authorWelcome.show}
                    authorName={authorWelcome.name}
                    onClose={() => setAuthorWelcome({ show: false, name: '' })}
                />
            )}

            <Toast message={toastMessage} />
        </div>
    );
};

export default App;
