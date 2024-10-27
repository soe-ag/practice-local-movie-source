<script setup lang="ts">
definePageMeta({
  layout: "login",
});
const supabase = useSupabaseClient();
const router = useRouter();

const email = ref<string>("soeag.m@gmail.com");
const password = ref<string>("soeaungdev");
const showError = ref(false);

const handleSignIn = async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });
  if (error) {
    console.log(error);
    showError.value = true;
  } else router.push("/");
};
</script>

<!-- eslint-disable vue/html-self-closing -->
<template>
  <div class="p-10 text-center lg:w-100 backdrop-blur-md rounded-2xl bg-gray-8">
    <div class="text-3xl font-medium mb-8">Welcome back!</div>
    <InputText
      v-model="email"
      type="text"
      class="!py-3 !px-4 !w-full !outline-0 !mb-6 !bg-white/10 !rounded-full"
      placeholder="Email"
    />
    <InputText
      v-model="password"
      type="password"
      class="!py-3 !px-4 !w-full !outline-0 !mb-6 !bg-white/10 !rounded-full"
      placeholder="Password"
    />
    <button
      type="button"
      class="max-w-20 w-full text-sm rounded-full py-2 px-2 bg-white/30 hover:bg-white/40 active:bg-white/20 cursor-pointer transition-colors duration-150"
      @click="() => handleSignIn()"
    >
      Sign In
    </button>

    <div v-if="showError === true" class="text-red text-sm mt-3">
      Invalid login credentials!
    </div>
  </div>
</template>
