<script setup lang="ts">
// TODO: Implement Convex authentication check
// For now, redirect to home page
// In production, check Convex auth state or use Clerk/other auth provider
onMounted(() => {
  navigateTo("/");
});
</script>

<template>
  <div>Waiting for login...</div>
</template>
