<script setup lang='ts'>
import { computed, ref } from 'vue'
import type { FormItemRule } from 'naive-ui'
import { NButton, NCountdown, NForm, NFormItem, NInput, NModal, useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { fetchGetCode, fetchGptLogin } from '@/api'
import { useAuthStore, useUserStore } from '@/store'
import Icon403 from '@/icons/403.vue'
interface Props {
  visible: boolean
}

defineProps<Props>()
const { t } = useI18n() // use as global scope
const authStore = useAuthStore()
const userStore = useUserStore()

const ms = useMessage()

const loading = ref(false)

const formRef = ref()

const loginDataInfo = ref({
  // 15281395818
  phone: '',
  code: '',
})
const rules = {
  phone: {
    required: true,
    trigger: ['blur'],
    key: 'phone',
    validator: (rule: FormItemRule, value: string) => {
      if (/^1([3589]\d|4[5-9]|6[1-2,4-7]|7[0-8])\d{8}$/.test(value))
        return true
      else
        return new Error(t('login.accountError'))
    },
  },
  code: {
    trigger: ['blur'],
    required: true,
    validator: (rule: FormItemRule, value: string) => {
      if (value.trim().length)
        return true
      else
        return new Error(t('login.codePlaceholder'))
    },
  },
}
const loginReactive = ref({
  countdownActive: false,
  countdownShow: false,
  countdownDuration: 5000,
  countdownOnFinish() {
    loginReactive.value.countdownActive = false
    loginReactive.value.countdownShow = false
  },
  renderCountdown(props: { hours: number; minutes: number; seconds: number; milliseconds: number }) {
    return `${props.seconds}s`
  },
  loginBtnDisabled: computed(() => !(loginDataInfo.value.phone.trim() && loginDataInfo.value.code.trim())),
  loginBtnLoading: false,
})
async function handleClickGetCode() {
  formRef.value?.validate(async (errors: any) => {
    if (!errors) {
      try {
        loading.value = true
        const res = await fetchGetCode(loginDataInfo.value.phone)
        loginDataInfo.value.code = res.data
        loginReactive.value.countdownActive = true
        loginReactive.value.countdownShow = true
        // 重置表单校验
        formRef.value?.restoreValidation()
      }
      catch (error: any) {

      }
      finally {
        loading.value = false
      }
    }
  }, (rule: typeof rules.phone) => {
    return rule?.key === 'phone'
  })
}
// 登陆
async function handleLogin() {
  try {
    loginReactive.value.loginBtnLoading = true
    const res = await fetchGptLogin(loginDataInfo.value)
    authStore.setToken(res.data.token)
    userStore.updateUserInfo({ name: res.data.name })
    ms.success('success')
    window.location.reload()
  }
  catch (error: any) {
    ms.error(error.message ?? 'error')
    authStore.removeToken()
  }
  finally {
    loginReactive.value.loginBtnLoading = false
  }
}
</script>

<template>
  <NModal :show="visible" style="width: 90%; max-width: 640px">
    <div class="p-10 bg-white rounded dark:bg-slate-800">
      <div class="space-y-4">
        <header class="space-y-2">
          <p class="text-base text-center text-slate-500 dark:text-slate-500">
            {{ $t('common.unauthorizedTips') }}
          </p>
          <Icon403 class="w-[200px] m-auto" />
        </header>
        <NForm ref="formRef" label-width="70" label-placement="left" :model="loginDataInfo" :rules="rules">
          <NFormItem :label="$t('login.account')" path="phone">
            <NInput v-model:value="loginDataInfo.phone" :placeholder="$t('login.accountPlaceholder')" />
          </NFormItem>
          <NFormItem :label="$t('login.code')" path="code">
            <NInput
              v-model:value="loginDataInfo.code"
              :placeholder="$t('login.codePlaceholder')"
            />
            <NButton type="primary" style="width: 6rem;" :disabled="loginReactive.countdownShow || !loginDataInfo.phone" @click="handleClickGetCode">
              {{ loginReactive.countdownShow ? '' : $t('login.getCode') }}
              <NCountdown
                v-if="loginReactive.countdownShow"
                :on-finish="loginReactive.countdownOnFinish"
                :duration="loginReactive.countdownDuration"
                :active="loginReactive.countdownActive"
                :render="loginReactive.renderCountdown"
              />
            </NButton>
          </NFormItem>
          <NFormItem>
            <NButton
              block
              type="primary"
              :disabled="loginReactive.loginBtnDisabled || loginReactive.loginBtnLoading"
              :loading="loginReactive.loginBtnLoading"
              @click="handleLogin"
            >
              {{ $t('common.verify') }}
            </NButton>
          </NFormItem>
        </NForm>
      </div>
    </div>
  </NModal>
</template>
