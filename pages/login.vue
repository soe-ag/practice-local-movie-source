<script setup lang="ts">
definePageMeta({
  layout: "login",
});
const supabase = useSupabaseClient();
const router = useRouter();

const email = ref<string>("soeag.dev@gmail.com");
const password = ref<string>("soeagdev");
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
  <div
    class="p-10 text-center w-85 lg:w-100 backdrop-blur-md rounded-2xl bg-#0e1111 b-2 b-gray-800 b-solid"
  >
    <div class="text-2xl text-gray-100 font-medium mb-1">Welcome!</div>
    <div class="text-sm text-yellow-500 font-medium mb-6">
      This is test account, just click sign in :D
    </div>
    <InputText
      model-value="test@email.com"
      type="text"
      class="!py-2 !px-4 !w-full !outline-0 !mb-4 !bg-gray-800 !text-gray-400 !rounded-full !text-sm"
      placeholder="Email"
      disabled
    />
    <!-- <InputText
      v-model="password"
      type="password"
      class="!py-2 !px-4 !w-full !outline-0 !mb-4 !bg-gray-900 !text-gray-100 !rounded-full !text-sm"
      disabled
    /> -->

    <!-- <button
      type="button"
      class="max-w-20 w-full !text-sm rounded-full py-2 px-2 bg-white/30 hover:bg-white/40 active:bg-white/20 cursor-pointer transition-colors duration-150"
      @click="() => handleSignIn()"
    >
      Sign In
    </button> -->

    <Button
      label="Primary"
      rounded
      type="button"
      class="max-w-20 w-full !text-sm rounded-full py-2 px-2 bg-white/30 hover:bg-white/40 active:bg-white/20 cursor-pointer transition-colors duration-150"
      @click="() => handleSignIn()"
      >Sign In</Button
    >

    <div v-if="showError === true" class="text-red text-sm mt-3">
      Invalid login credentials!
    </div>
  </div>
</template>
