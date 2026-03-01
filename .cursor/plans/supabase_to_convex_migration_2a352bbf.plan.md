---
name: Supabase to Convex Migration
overview: Migrate the Nuxt 3 movie application from Supabase to Convex, replacing authentication, database operations, and client-side data fetching with Convex's function-based architecture.
todos:
  - id: todo-1768521369104-4j4ef6r6h
    content: ""
    status: pending
---

# Supabase to Convex Migration Plan

## Current Architecture Analysis

The application currently uses:

- **Supabase Authentication**: Email/password login via `useSupabaseClient().auth.signInWithPassword()`
- **Supabase Database**: Two tables (`favoriteList`, `watchList`) storing `DbMovie` objects
- **Supabase Nuxt Module**: `@nuxtjs/supabase` for integration
- **Database Operations**: 
- `SELECT` queries in [pages/Favorite.vue](pages/Favorite.vue) and [pages/WatchList.vue](pages/WatchList.vue)
- `INSERT` operations in [components/ItemSmart.vue](components/ItemSmart.vue)
- `DELETE` operations in both Favorite and WatchList pages

## Migration Strategy

### Phase 1: Setup Convex Infrastructure

1. **Install Convex dependencies**

- Add `convex` package
- Add `@nuxtjs/convex` or use Convex client directly
- Remove `@nuxtjs/supabase` and `@supabase/supabase-js` from dependencies

2. **Initialize Convex project**

- Run `npx convex dev` to create `convex/` directory
- Create `convex/schema.ts` to define data models
- Set up Convex configuration in [nuxt.config.ts](nuxt.config.ts)

3. **Define Convex schema**

- Create schema for `favoriteList` and `watchList` tables
- Map `DbMovie` type structure to Convex schema
- Include user association for multi-user support

### Phase 2: Create Convex Backend Functions

1. **Authentication functions** (`convex/auth.ts`)

- Replace Supabase auth with Convex auth
- Implement login mutation
- Create user session management

2. **Query functions** (`convex/movies.ts`)

- `getFavoriteList`: Query to fetch user's favorite movies
- `getWatchList`: Query to fetch user's watchlist movies

3. **Mutation functions** (`convex/movies.ts`)

- `addToFavoriteList`: Mutation to add movie to favorites
- `addToWatchList`: Mutation to add movie to watchlist
- `removeFromFavoriteList`: Mutation to remove from favorites
- `removeFromWatchList`: Mutation to remove from watchlist

### Phase 3: Update Frontend Components

1. **Replace Supabase client with Convex client**

- Update [pages/login.vue](pages/login.vue): Replace `useSupabaseClient()` with Convex auth
- Update [pages/Favorite.vue](pages/Favorite.vue): Replace `useSupabaseClient()` with Convex queries/mutations
- Update [pages/WatchList.vue](pages/WatchList.vue): Replace `useSupabaseClient()` with Convex queries/mutations
- Update [components/ItemSmart.vue](components/ItemSmart.vue): Replace `useSupabaseClient()` with Convex mutations
- Update [pages/confirm.vue](pages/confirm.vue): Replace `useSupabaseUser()` with Convex auth state

2. **Update data fetching patterns**

- Replace `useAsyncData` with Convex's reactive queries
- Use `useQuery` for fetching lists
- Use `useMutation` for add/remove operations
- Maintain existing sorting and filtering logic (client-side)

3. **Update [nuxt.config.ts](nuxt.config.ts)**

- Remove `@nuxtjs/supabase` from modules array
- Add Convex configuration (if using Nuxt module) or configure Convex client

### Phase 4: Data Migration (if needed)

1. **Export existing data** from Supabase
2. **Import data** into Convex using migration scripts
3. **Verify data integrity**

### Phase 5: Cleanup

1. **Remove Supabase dependencies** from [package.json](package.json)
2. **Delete unused Supabase utilities** ([utils/sbUtils.ts](utils/sbUtils.ts) if it exists)
3. **Update environment variables** (remove Supabase keys, add Convex deployment URL)
4. **Update documentation** in [README.md](README.md)

## Key Files to Modify

- [package.json](package.json) - Update dependencies
- [nuxt.config.ts](nuxt.config.ts) - Remove Supabase module, add Convex config
- [pages/login.vue](pages/login.vue) - Replace authentication
- [pages/Favorite.vue](pages/Favorite.vue) - Replace database operations
- [pages/WatchList.vue](pages/WatchList.vue) - Replace database operations
- [components/ItemSmart.vue](components/ItemSmart.vue) - Replace insert operations
- [pages/confirm.vue](pages/confirm.vue) - Replace user check
- [utils/type.ts](utils/type.ts) - Verify type compatibility with Convex

## New Files to Create

- `convex/schema.ts` - Database schema definition
- `convex/auth.ts` - Authentication functions
- `convex/movies.ts` - Movie list queries and mutations
- `.env.local` - Convex deployment URL (if not using Nuxt module)

## Considerations

1. **Authentication**: Convex uses different auth patterns (Clerk integration or custom auth). Need to decide on auth provider.
2. **Real-time**: Convex provides automatic real-time updates via queries, which may simplify the current refresh logic
3. **Type Safety**: Convex provides excellent TypeScript support with generated types
4. **User Context**: Convex queries/mutations automatically include user context, simplifying user-specific data access
5. **Error Handling**: Update error handling patterns to match Convex's error structure

## Testing Checklist

- [ ] Authentication flow works
- [ ] Favorite list CRUD operations work
- [ ] Watchlist CRUD operations work
- [ ] Sorting functionality preserved
- [ ] Error handling works correctly
- [ ] Real-time updates work (if applicable)