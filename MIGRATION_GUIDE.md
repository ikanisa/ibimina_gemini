# Component Migration Guide

**Purpose:** Step-by-step guide for migrating existing components to use the new refactored architecture

---

## 🎯 Migration Strategy

### Phase 1: Foundation ✅ **COMPLETE**
- API services created
- Custom hooks created
- UI components created
- Utilities created

### Phase 2: Component Migration (Current Phase)
- Migrate components one at a time
- Test after each migration
- Keep old code until migration verified

---

## 📝 Migration Steps

### Step 1: Identify Component Dependencies

Before migrating, identify:
1. What data does the component fetch?
2. What CRUD operations does it perform?
3. What UI patterns does it use?
4. What validation does it need?

### Step 2: Replace Data Fetching

**Before:**
```typescript
const [members, setMembers] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  const loadMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('institution_id', institutionId);
    // ... manual state management
  };
  loadMembers();
}, [institutionId]);
```

**After:**
```typescript
const { members, loading, error, refetch } = useMembers({
  includeGroups: true,
  autoFetch: true
});
```

### Step 3: Replace CRUD Operations

**Before:**
```typescript
const handleCreate = async () => {
  setIsSubmitting(true);
  const { data, error } = await supabase
    .from('members')
    .insert({ ... });
  // ... manual error handling
};
```

**After:**
```typescript
const { createMember } = useMembers();

const handleCreate = async () => {
  try {
    await createMember({ ... });
    // Success - hook automatically updates state
  } catch (err) {
    // Error handling
  }
};
```

### Step 4: Replace UI Components

**Before:**
```typescript
<div className="fixed inset-0 bg-black/50 ...">
  <div className="bg-white rounded-xl ...">
    {/* Modal content */}
  </div>
</div>
```

**After:**
```typescript
<Modal isOpen={isOpen} onClose={onClose} title="Add Member">
  {/* Modal content */}
</Modal>
```

### Step 5: Add Validation

**Before:**
```typescript
if (!name.trim()) {
  setError('Name is required');
  return;
}
```

**After:**
```typescript
import { validateMemberData } from '../lib/validation';

const validation = validateMemberData({ full_name: name, phone });
if (!validation.isValid) {
  setFormErrors(validation.errors);
  return;
}
```

### Step 6: Replace Loading/Error States

**Before:**
```typescript
if (loading) {
  return <div className="spinner">Loading...</div>;
}
if (error) {
  return <div className="error">{error}</div>;
}
```

**After:**
```typescript
import { LoadingSpinner, ErrorDisplay } from './ui';

if (loading) return <LoadingSpinner size="lg" />;
if (error) return <ErrorDisplay error={error} />;
```

---

## 🔄 Example: Members Component Migration

See `components/Members.refactored.tsx` for a complete example of:
- Using `useMembers` hook
- Using validation utilities
- Using UI components
- Using transformers
- Proper error handling

---

## ✅ Migration Checklist

For each component:

- [ ] Replace data fetching with hooks
- [ ] Replace CRUD operations with hook methods
- [ ] Replace manual state management
- [ ] Add validation using validation utilities
- [ ] Replace custom modals with `<Modal>` component
- [ ] Replace loading states with `<LoadingSpinner>`
- [ ] Replace error displays with `<ErrorDisplay>`
- [ ] Replace buttons with `<Button>` component
- [ ] Replace form fields with `<FormField>` component
- [ ] Use transformers for data transformation
- [ ] Test all functionality
- [ ] Remove old code

---

## 🚨 Common Pitfalls

1. **Don't mix old and new patterns** - Fully migrate or don't migrate
2. **Don't forget to handle errors** - Use ErrorDisplay component
3. **Don't skip validation** - Use validation utilities
4. **Don't forget to test** - Test after each migration
5. **Don't remove old code too early** - Keep until migration verified

---

## 📚 Reference

- **API Services:** `lib/api/`
- **Hooks:** `hooks/`
- **UI Components:** `components/ui/`
- **Validation:** `lib/validation/`
- **Transformers:** `lib/transformers/`
- **Error Handling:** `lib/errors/`

---

## 🎓 Best Practices

1. **Start Small:** Migrate smallest components first
2. **Test Thoroughly:** Test after each migration
3. **Document Changes:** Note what was changed
4. **Keep It Simple:** Don't over-engineer
5. **Consistent Patterns:** Follow the established patterns

---

**Ready to migrate? Start with the Members component example!**

