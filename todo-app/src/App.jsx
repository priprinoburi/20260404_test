import { useState, useEffect, useRef } from 'react'
import './App.css'

const PRIORITIES = ['low', 'medium', 'high']

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function useTodos() {
  const [todos, setTodos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('todos') || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  const addTodo = (text, priority, dueDate) => {
    if (!text.trim()) return
    setTodos(prev => [
      { id: generateId(), text: text.trim(), completed: false, priority, dueDate, createdAt: Date.now() },
      ...prev,
    ])
  }

  const toggleTodo = id =>
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)))

  const deleteTodo = id => setTodos(prev => prev.filter(t => t.id !== id))

  const editTodo = (id, text) =>
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, text } : t)))

  const clearCompleted = () => setTodos(prev => prev.filter(t => !t.completed))

  return { todos, addTodo, toggleTodo, deleteTodo, editTodo, clearCompleted }
}

function AddTodoForm({ onAdd }) {
  const [text, setText] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = e => {
    e.preventDefault()
    onAdd(text, priority, dueDate)
    setText('')
    setDueDate('')
    setPriority('medium')
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <div className="add-form-main">
        <input
          className="add-input"
          type="text"
          placeholder="新しいタスクを追加..."
          value={text}
          onChange={e => setText(e.target.value)}
          autoFocus
        />
        <button className="add-btn" type="submit" disabled={!text.trim()}>
          追加
        </button>
      </div>
      <div className="add-form-sub">
        <div className="priority-select">
          {PRIORITIES.map(p => (
            <button
              key={p}
              type="button"
              className={`priority-btn priority-${p} ${priority === p ? 'selected' : ''}`}
              onClick={() => setPriority(p)}
            >
              {p === 'low' ? '低' : p === 'medium' ? '中' : '高'}
            </button>
          ))}
        </div>
        <input
          className="due-input"
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          title="期限日"
        />
      </div>
    </form>
  )
}

function TodoItem({ todo, onToggle, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const commitEdit = () => {
    const trimmed = editText.trim()
    if (trimmed) onEdit(todo.id, trimmed)
    else setEditText(todo.text)
    setEditing(false)
  }

  const isOverdue =
    todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date(new Date().toDateString())

  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
      <span className={`priority-dot priority-${todo.priority}`} title={todo.priority} />
      <input
        className="todo-check"
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      {editing ? (
        <input
          ref={inputRef}
          className="todo-edit-input"
          value={editText}
          onChange={e => setEditText(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') commitEdit()
            if (e.key === 'Escape') { setEditText(todo.text); setEditing(false) }
          }}
        />
      ) : (
        <span
          className="todo-text"
          onDoubleClick={() => !todo.completed && setEditing(true)}
          title={todo.completed ? '' : 'ダブルクリックで編集'}
        >
          {todo.text}
        </span>
      )}
      {todo.dueDate && (
        <span className={`due-badge ${isOverdue ? 'overdue' : ''}`}>
          {isOverdue ? '期限切れ: ' : ''}{todo.dueDate}
        </span>
      )}
      <button className="delete-btn" onClick={() => onDelete(todo.id)} title="削除">
        ×
      </button>
    </li>
  )
}

export default function App() {
  const { todos, addTodo, toggleTodo, deleteTodo, editTodo, clearCompleted } = useTodos()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = todos.filter(t => {
    const matchesFilter =
      filter === 'all' || (filter === 'active' ? !t.completed : t.completed)
    const matchesSearch = t.text.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const activeCount = todos.filter(t => !t.completed).length
  const completedCount = todos.filter(t => t.completed).length

  return (
    <div className="app">
      <header className="app-header">
        <h1>TODO</h1>
        <p className="app-subtitle">
          {activeCount} 件残り
          {completedCount > 0 && ` · 完了 ${completedCount} 件`}
        </p>
      </header>

      <AddTodoForm onAdd={addTodo} />

      <div className="controls">
        <input
          className="search-input"
          type="text"
          placeholder="検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="filter-tabs">
          {[['all', 'すべて'], ['active', '未完了'], ['completed', '完了']].map(([key, label]) => (
            <button
              key={key}
              className={`filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty">
          {search ? '検索結果がありません' : filter === 'completed' ? '完了済みタスクなし' : 'タスクなし'}
        </p>
      ) : (
        <ul className="todo-list">
          {filtered.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onEdit={editTodo}
            />
          ))}
        </ul>
      )}

      {completedCount > 0 && (
        <button className="clear-btn" onClick={clearCompleted}>
          完了済みをクリア ({completedCount})
        </button>
      )}
    </div>
  )
}
