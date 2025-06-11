# Modulus Defence - Input Field Best Practices

## 🚨 CRITICAL: Input Focus Issue Prevention

### ❌ **NEVER DO THIS:**
```jsx
// BAD - Causes focus loss on every keystroke
const [email, setEmail] = useState('');

<input 
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

### ✅ **ALWAYS DO THIS:**
```jsx
// GOOD - Pure HTML approach
<input 
  id="unique-input-id"
  defaultValue=""
  type="email"
  required
/>

// Access value in form handler:
const handleSubmit = (e) => {
  e.preventDefault();
  const email = document.getElementById('unique-input-id').value;
  // Use email value...
}
```

## 📋 **Development Rules:**

### 1. **Input Component Standards**
- ✅ Use `defaultValue=""` instead of `value={state}`
- ✅ Use `id="unique-id"` for DOM access
- ✅ Access values via `document.getElementById()` in handlers
- ❌ Never use `value={state}` + `onChange` for form inputs

### 2. **Form Handler Pattern**
```jsx
const handleFormSubmit = (e) => {
  e.preventDefault();
  
  // Get values from DOM (not state)
  const formData = {
    email: document.getElementById('email-input').value,
    password: document.getElementById('password-input').value,
    company: document.getElementById('company-input').value
  };
  
  // Process form data...
};
```

### 3. **React State Usage**
- ✅ Use React state for: UI state, loading states, user data
- ❌ Never use React state for: form input values during typing

### 4. **Testing Checklist**
Before deploying any form:
- [ ] Can type complete sentences without losing focus?
- [ ] Can use backspace/delete without issues?
- [ ] Can copy/paste text normally?
- [ ] Works on mobile devices?

## 🔧 **Quick Fix Converter**

### Convert Existing Inputs:
1. **Find:** `value={someState}`
2. **Replace with:** `defaultValue=""`
3. **Add:** `id="unique-input-id"`
4. **Remove:** `onChange` handler
5. **Update form handler** to use `getElementById()`

### Example Conversion:
```jsx
// BEFORE (broken)
<input 
  value={username} 
  onChange={(e) => setUsername(e.target.value)}
  type="text"
/>

// AFTER (working)
<input 
  id="username-input"
  defaultValue=""
  type="text"
/>
```

## 🚨 **Emergency Fix Protocol**

If users report typing issues:

1. **Immediate Action:**
   - Replace `value={state}` with `defaultValue=""`
   - Add unique `id` attributes
   - Update form handlers to use DOM access

2. **Restart Services:**
   ```bash
   sudo supervisorctl restart frontend
   ```

3. **Test immediately** on the live site

## 🛠️ **Code Review Requirements**

All form-related PRs must:
- [ ] Use uncontrolled inputs (defaultValue)
- [ ] Have unique IDs for all inputs
- [ ] Use DOM access in form handlers
- [ ] Pass typing test (can type "Hello World Testing 123")

## 📝 **Approved Input Pattern**

```jsx
// Standard input component for Modulus Defence
const InputField = ({ id, type = "text", label, placeholder, required = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <input
      id={id}
      type={type}
      required={required}
      defaultValue=""
      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
      placeholder={placeholder}
    />
  </div>
);

// Usage:
<InputField 
  id="user-email"
  type="email" 
  label="Email"
  placeholder="your.email@company.com"
  required
/>
```

## 🎯 **Success Criteria**

A form input is correct when:
- ✅ Users can type complete sentences
- ✅ No focus loss during typing
- ✅ Backspace/delete works normally
- ✅ Copy/paste works normally
- ✅ Mobile typing works normally

Remember: **If it uses `value={state}`, it's probably broken!**