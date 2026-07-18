import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, Plus, Trash2, Edit3, Search, 
  Calendar, X, Moon, Sun, Info, AlertCircle, 
  RefreshCw, Layers
} from 'lucide-react';

interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  createdAt: number;
}

const DEFAULT_CATEGORIES = ['Work', 'Personal', 'Shopping', 'Health', 'Ideas'];

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'alphabetical'>('date');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Modals / Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState('Personal');
  const [dueDate, setDueDate] = useState('');

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const isChromeExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  const isPopup = window.self === window.top;

  // Dynamically set HTML/body size if in popup
  useEffect(() => {
    if (isPopup) {
      document.documentElement.style.width = '800px';
      document.documentElement.style.height = '600px';
      document.body.style.width = '800px';
      document.body.style.height = '600px';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.overflow = 'hidden';
    }
  }, [isPopup]);

  const handleClose = () => {
    if (isPopup) {
      window.close();
    } else {
      window.parent.postMessage({ action: 'close-sota-todo' }, '*');
    }
  };

  // Sync state with chrome.storage or localStorage
  useEffect(() => {
    if (isChromeExtension) {
      chrome.storage.local.get(['theme', 'todos'], (result: any) => {
        if (result.theme) {
          setTheme(result.theme);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setTheme('dark');
        }
        setTodos(result.todos || []);
        setLoading(false);
      });
    } else {
      const savedTheme = localStorage.getItem('sota_theme') as 'light' | 'dark' | null;
      if (savedTheme) {
        setTheme(savedTheme);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      }
      const savedTodos = localStorage.getItem('sota_todos');
      setTodos(savedTodos ? JSON.parse(savedTodos) : []);
      setLoading(false);
    }
  }, []);

  // Update Theme in DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    if (isChromeExtension) {
      chrome.storage.local.set({ theme });
    } else {
      localStorage.setItem('sota_theme', theme);
    }
  }, [theme]);

  // Save todos whenever they change
  const saveTodos = (updatedTodos: Todo[]) => {
    setTodos(updatedTodos);
    if (isChromeExtension) {
      chrome.storage.local.set({ todos: updatedTodos });
    } else {
      localStorage.setItem('sota_todos', JSON.stringify(updatedTodos));
    }
  };

  // Listen to messages from content script (e.g. when overlay is shown)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.action === 'overlay-shown') {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Listen to keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFormOpen) {
          closeForm();
        } else {
          handleClose();
        }
        return;
      }

      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          openAddForm();
          break;
        case '/':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case 't':
          e.preventDefault();
          setTheme(prev => prev === 'light' ? 'dark' : 'light');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFormOpen]);

  // CRUD Operations
  const openAddForm = () => {
    setEditingTodo(null);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setCategory('Personal');
    setDueDate('');
    setIsFormOpen(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 50);
  };

  const openEditForm = (todo: Todo) => {
    setEditingTodo(todo);
    setTitle(todo.title);
    setDescription(todo.description);
    setPriority(todo.priority);
    setCategory(todo.category);
    setDueDate(todo.dueDate || '');
    setIsFormOpen(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 50);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTodo(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTodo) {
      const updated = todos.map(t => t.id === editingTodo.id ? {
        ...t,
        title,
        description,
        priority,
        category,
        dueDate: dueDate || undefined
      } : t);
      saveTodos(updated);
    } else {
      const newTodo: Todo = {
        id: crypto.randomUUID(),
        title,
        description,
        completed: false,
        priority,
        category,
        dueDate: dueDate || undefined,
        createdAt: Date.now()
      };
      saveTodos([newTodo, ...todos]);
    }
    closeForm();
  };

  const toggleComplete = (id: string) => {
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTodos(updated);
  };

  const deleteTodo = (id: string) => {
    const updated = todos.filter(t => t.id !== id);
    saveTodos(updated);
  };

  const clearCompleted = () => {
    const updated = todos.filter(t => !t.completed);
    saveTodos(updated);
  };

  // Helper Stats Calculation
  const totalCount = todos.length;
  const completedCount = todos.filter(t => t.completed).length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filters & Sorting logic
  const filteredTodos = todos
    .filter(todo => {
      const matchesSearch = todo.title.toLowerCase().includes(search.toLowerCase()) || 
                            todo.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || todo.category === selectedCategory;
      const matchesPriority = selectedPriority === 'All' || todo.priority === selectedPriority;
      return matchesSearch && matchesCategory && matchesPriority;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityVal = { high: 3, medium: 2, low: 1 };
        return priorityVal[b.priority] - priorityVal[a.priority];
      }
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return b.createdAt - a.createdAt; // date
    });

  // All active categories
  const categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...todos.map(t => t.category)]));

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground font-sans">
        <div className="border-3 border-foreground bg-secondary px-6 py-4 flex items-center gap-3 shadow-md animate-pulse">
          <RefreshCw className="animate-spin h-5 w-5" />
          <span className="font-mono font-bold tracking-widest text-lg">LOADING KAIROS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={isPopup ? "w-full h-full overflow-hidden font-sans bg-background" : "relative flex h-screen w-screen bg-black/40 backdrop-blur-xs justify-center items-center p-4 md:p-8 font-sans overflow-hidden"}>
      
      {/* Click outside backdrop will close the extension */}
      {!isPopup && (
        <div 
          className="absolute inset-0 z-0" 
          onClick={handleClose}
        />
      )}

      {/* Main Extension Modal */}
      <div className={isPopup 
        ? "relative w-full h-full bg-background border-none flex flex-col md:flex-row overflow-hidden transition-colors duration-200"
        : "relative z-10 w-full max-w-5xl h-full max-h-[85vh] bg-background border-3 border-foreground shadow-lg flex flex-col md:flex-row overflow-hidden transition-colors duration-200"
      }>
        
        {/* Left Sidebar */}
        <aside className="w-full md:w-80 bg-sidebar border-b-3 md:border-b-0 md:border-r-3 border-foreground p-5 flex flex-col justify-between overflow-y-auto no-scrollbar">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="bg-primary text-primary-foreground border-2 border-foreground px-4 py-1 font-mono font-black text-xl tracking-tight shadow-2xs rotate-[-2deg]">
                KAIROS
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="p-1.5 border-2 border-foreground bg-card hover:bg-secondary transition-all shadow-2xs hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-0 active:translate-y-0 cursor-pointer"
                  title="Toggle Theme (T)"
                >
                  {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>
                <button 
                  onClick={handleClose}
                  className="p-1.5 border-2 border-foreground bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all shadow-2xs hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-0 active:translate-y-0 cursor-pointer md:hidden"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Completion Progress Summary Card */}
            <div className="bg-card border-2 border-foreground p-4 mb-6 shadow-xs relative">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Progress</div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-mono text-2xl font-black">{completionRate}%</span>
                <span className="font-mono text-xs text-muted-foreground">{completedCount} of {totalCount} completed</span>
              </div>
              <div className="w-full bg-muted border border-foreground h-2.5 rounded-none p-[1px]">
                <div 
                  className="bg-primary h-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            {/* Priority Filter */}
            <div className="mb-6">
              <h4 className="font-mono font-black text-xs uppercase tracking-widest mb-2 text-muted-foreground">Priority</h4>
              <div className="grid grid-cols-4 gap-1.5">
                {['All', 'low', 'medium', 'high'].map(p => (
                  <button
                    key={p}
                    onClick={() => setSelectedPriority(p)}
                    className={`border-2 border-foreground py-1 text-[10px] font-bold font-mono uppercase transition-all cursor-pointer shadow-2xs
                      ${selectedPriority === p 
                        ? 'bg-secondary text-foreground translate-x-[1px] translate-y-[1px] shadow-none' 
                        : 'bg-card text-foreground hover:bg-muted'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-mono font-black text-xs uppercase tracking-widest text-muted-foreground">Categories</h4>
                <Layers className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`flex justify-between items-center px-3 py-1.5 text-xs font-bold font-mono border-2 border-foreground transition-all shadow-2xs cursor-pointer
                    ${selectedCategory === 'All' 
                      ? 'bg-accent text-accent-foreground translate-x-[1px] translate-y-[1px] shadow-none' 
                      : 'bg-card text-foreground hover:bg-muted'
                    }`}
                >
                  <span>ALL CATEGORIES</span>
                  <span className="bg-foreground text-background text-[10px] font-bold px-1.5">{todos.length}</span>
                </button>
                {categories.map(cat => {
                  const count = todos.filter(t => t.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex justify-between items-center px-3 py-1.5 text-xs font-bold font-mono border-2 border-foreground transition-all shadow-2xs cursor-pointer
                        ${selectedCategory === cat 
                          ? 'bg-accent text-accent-foreground translate-x-[1px] translate-y-[1px] shadow-none' 
                          : 'bg-card text-foreground hover:bg-muted'
                        }`}
                    >
                      <span className="truncate">{cat.toUpperCase()}</span>
                      <span className="bg-foreground text-background text-[10px] font-bold px-1.5">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Help Guide */}
          <div className="bg-card border-2 border-foreground p-3 mt-4 text-[11px] font-mono text-muted-foreground">
            <div className="flex items-center gap-1.5 font-bold mb-1 text-foreground">
              <Info className="h-3.5 w-3.5" />
              SHORTCUTS
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <div><kbd className="bg-muted px-1 border border-foreground text-foreground">N</kbd> New task</div>
              <div><kbd className="bg-muted px-1 border border-foreground text-foreground">/</kbd> Search</div>
              <div><kbd className="bg-muted px-1 border border-foreground text-foreground">T</kbd> Dark/Light</div>
              <div><kbd className="bg-muted px-1 border border-foreground text-foreground">Esc</kbd> Close</div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-h-0 bg-background">
          
          {/* Top Control Bar */}
          <section className="p-5 border-b-3 border-foreground bg-card flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            
            {/* Search Box */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-foreground" />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks... (Press '/' to focus)"
                className="w-full pl-10 pr-4 py-2 border-2 border-foreground bg-background text-foreground font-mono text-xs outline-none focus:ring-2 focus:ring-primary shadow-xs transition-shadow"
              />
            </div>

            {/* Sorting / Action Options */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="border-2 border-foreground bg-background text-foreground py-2 px-3 font-mono text-xs outline-none cursor-pointer shadow-xs focus:ring-2 focus:ring-primary"
              >
                <option value="date">DATE CREATED</option>
                <option value="priority">PRIORITY</option>
                <option value="alphabetical">ALPHABETICAL</option>
              </select>

              <button
                onClick={openAddForm}
                className="flex items-center justify-center gap-1.5 bg-primary text-primary-foreground border-2 border-foreground py-2 px-4 font-mono text-xs font-black shadow-xs hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-0 active:translate-y-0 cursor-pointer transition-all uppercase"
              >
                <Plus className="h-4 w-4 stroke-[3px]" />
                NEW TASK
              </button>
            </div>
          </section>

          {/* Task list container */}
          <section className="flex-1 overflow-y-auto p-5 min-h-0 no-scrollbar">
            {filteredTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-foreground/40 bg-card p-6 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="font-mono font-bold text-foreground">No tasks found</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Create a new task, adjust your active filters, or try a different search.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredTodos.map((todo) => {
                  const isOverdue = todo.dueDate && !todo.completed && new Date(todo.dueDate).getTime() < new Date().setHours(0,0,0,0);
                  
                  return (
                    <article 
                      key={todo.id}
                      className={`group border-2 border-foreground p-4 bg-card shadow-xs hover:shadow-sm transition-all duration-150 flex items-start gap-3 relative
                        ${todo.completed ? 'bg-muted/30 border-muted-foreground/30 text-muted-foreground' : ''}
                      `}
                    >
                      {/* Priority Tag line on left border */}
                      <span className={`absolute left-0 top-0 bottom-0 w-1.5 
                        ${todo.priority === 'high' ? 'bg-primary' : todo.priority === 'medium' ? 'bg-secondary' : 'bg-accent'}
                      `} />

                      {/* Custom Checkbox */}
                      <button
                        onClick={() => toggleComplete(todo.id)}
                        className={`mt-0.5 w-6 h-6 border-2 border-foreground shrink-0 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:bg-secondary
                          ${todo.completed ? 'bg-success text-success-foreground border-muted-foreground/30' : 'bg-background text-foreground'}
                        `}
                      >
                        {todo.completed && <Check className="h-4 w-4 stroke-[3px]" />}
                      </button>

                      {/* Task Info */}
                      <div className="flex-1 min-w-0" onClick={() => openEditForm(todo)}>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className={`font-black text-sm md:text-base leading-tight cursor-pointer hover:text-accent select-none
                            ${todo.completed ? 'line-through decoration-2 decoration-foreground/60 opacity-60' : ''}
                          `}>
                            {todo.title}
                          </h3>
                          <span className={`px-2 py-0.5 border border-foreground text-[10px] font-mono font-bold uppercase rounded-none tracking-wider
                            ${todo.completed ? 'border-muted-foreground/30 text-muted-foreground/60' : 'bg-background text-foreground'}
                          `}>
                            {todo.category}
                          </span>
                          
                          {/* Due Date Indicator */}
                          {todo.dueDate && (
                            <span className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 border border-foreground rounded-none
                              ${isOverdue && !todo.completed ? 'bg-primary text-primary-foreground animate-pulse' : 'bg-card text-foreground'}
                            `}>
                              <Calendar className="h-3 w-3" />
                              {new Date(todo.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                            </span>
                          )}
                        </div>
                        {todo.description && (
                          <p className={`text-xs font-mono line-clamp-2 cursor-pointer
                            ${todo.completed ? 'text-muted-foreground/50' : 'text-muted-foreground'}
                          `}>
                            {todo.description}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditForm(todo)}
                          className="p-1 border-2 border-foreground bg-card hover:bg-secondary cursor-pointer shadow-2xs hover:translate-x-[-1px] hover:translate-y-[-1px]"
                          title="Edit Task"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="p-1 border-2 border-foreground bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer shadow-2xs hover:translate-x-[-1px] hover:translate-y-[-1px]"
                          title="Delete Task"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Footer Controls */}
          {completedCount > 0 && (
            <footer className="p-4 border-t-3 border-foreground bg-card flex justify-between items-center">
              <span className="font-mono text-xs text-muted-foreground">
                {completedCount} task(s) completed
              </span>
              <button
                onClick={clearCompleted}
                className="bg-destructive text-destructive-foreground border-2 border-foreground font-mono text-[10px] font-black px-2.5 py-1.5 shadow-2xs hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-0 active:translate-y-0 cursor-pointer transition-all"
              >
                CLEAR COMPLETED
              </button>
            </footer>
          )}
        </main>
      </div>

      {/* Task Add/Edit Form Overlay Modal */}
      {isFormOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-lg bg-background border-3 border-foreground p-6 shadow-lg relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-mono font-black text-base uppercase border-b-2 border-foreground pb-1">
                {editingTodo ? 'Edit Task' : 'New Task'}
              </h2>
              <button 
                onClick={closeForm}
                className="p-1 border-2 border-foreground bg-card hover:bg-primary hover:text-primary-foreground shadow-2xs active:translate-x-0 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold">TASK TITLE *</label>
                <input
                  ref={titleInputRef}
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Design Dashboard Prototypes"
                  className="w-full px-3 py-2 border-2 border-foreground bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-primary shadow-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold">DESCRIPTION</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details, links, or instructions..."
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-foreground bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-primary shadow-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold">PRIORITY</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full px-2 py-2 border-2 border-foreground bg-background text-foreground text-xs outline-none cursor-pointer shadow-xs focus:ring-2 focus:ring-primary"
                  >
                    <option value="low">LOW</option>
                    <option value="medium">MEDIUM</option>
                    <option value="high">HIGH</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold">CATEGORY</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Work, Personal, etc."
                    list="category-suggestions"
                    className="w-full px-3 py-2 border-2 border-foreground bg-background text-foreground text-xs outline-none shadow-xs focus:ring-2 focus:ring-primary"
                  />
                  <datalist id="category-suggestions">
                    {DEFAULT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold">DUE DATE</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-foreground bg-background text-foreground text-xs outline-none shadow-xs focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 border-2 border-foreground bg-card text-foreground hover:bg-muted font-bold text-xs shadow-xs cursor-pointer transition-all uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 border-2 border-foreground bg-primary text-primary-foreground font-black text-xs shadow-xs hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-0 active:translate-y-0 cursor-pointer transition-all uppercase"
                >
                  {editingTodo ? 'SAVE CHANGES' : 'CREATE TASK'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
