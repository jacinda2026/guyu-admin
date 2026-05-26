<template>
  <div class="billing-page">
    <div class="page-card">
      <div class="page-head">
        <div>
          <h1>账户充值</h1>
          <p>充值余额后可直接抵扣监控消耗</p>
        </div>
        <button class="link-btn" type="button" @click="router.push('/billing/details')">查看费用详情 <span>›</span></button>
      </div>

      <section class="account-panel">
        <div class="account-tile">
          <span>当前版本</span>
          <strong>★ 商业版</strong>
          <small>有效期至：--</small>
        </div>
        <div class="account-tile">
          <span>可用余额</span>
          <strong class="amount">¥2.38</strong>
        </div>
        <div class="account-tile">
          <span>余额构成</span>
          <p><b>充值余额：</b>¥2.38</p>
          <p><b>代金券：</b>¥0.00</p>
        </div>
      </section>

      <div class="content-grid">
        <section class="section-card recharge-section">
          <div class="section-head">
            <h2>选择充值金额</h2>
            <p>可选择固定金额，或输入自定义充值金额</p>
          </div>
          <div class="package-grid">
            <button
              v-for="item in packages"
              :key="item"
              class="package-item"
              :class="{ active: selectedAmount === item && !customAmount }"
              type="button"
              @click="selectPackage(item)"
            >
              <strong>¥{{ item }}</strong>
              <span>实得 ¥{{ item.toFixed(2) }}</span>
            </button>
            <div class="package-item custom-item" :class="{ active: !!customAmount }">
              <span>自定义</span>
              <el-input v-model.number="customAmount" class="custom-input" placeholder="0" @focus="selectedAmount = 0">
                <template #prefix>¥</template>
              </el-input>
              <small>实得 ¥{{ finalAmount.toFixed(2) }}</small>
            </div>
          </div>

          <div class="notice-box">
            <div class="notice-icon">i</div>
            <div>
              <strong>充值说明</strong>
              <p>充值后请关注账户中可用余额的变化。</p>
              <p>可用余额可用于抵扣监控消耗。</p>
            </div>
          </div>
        </section>

        <aside class="section-card order-section">
          <span>订单详情</span>
          <strong>¥{{ finalAmount.toFixed(2) }}</strong>
          <label>支付方式</label>
          <div class="pay-method"><span class="radio-dot"></span> 微信支付</div>
          <button class="buy-btn" type="button">确认购买 ¥{{ finalAmount.toFixed(2) }}</button>
        </aside>
      </div>

      <div class="bottom-tip">
        <span>i</span>
        需要专属的 GEO 监测方案&优化方案？请咨询企业定制客服
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const packages = [100, 200, 300, 500, 1000, 2000, 5000]
const selectedAmount = ref(0)
const customAmount = ref(0)

const finalAmount = computed(() => Number(customAmount.value || selectedAmount.value || 0))

const selectPackage = (amount) => {
  selectedAmount.value = amount
  customAmount.value = 0
}
</script>

<style scoped>
.billing-page { min-height: calc(100vh - 108px); padding: 0 24px 32px; background: #f5f6f8; color: #111827; }
.page-card { max-width: 1320px; min-height: 780px; margin: 0 auto; padding: 32px 36px; background: #fff; border-radius: 14px; }
.page-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; }
.page-head h1 { margin: 0 0 8px; font-size: 22px; font-weight: 800; }
.page-head p { margin: 0; color: #7c8794; font-size: 14px; }
.link-btn { border: 0; background: transparent; color: #2b7fff; font-size: 14px; cursor: pointer; }
.account-panel { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 12px; border: 1px solid #e5eaf0; border-radius: 12px; margin-bottom: 24px; }
.account-tile { min-height: 78px; border: 1px solid #e5eaf0; border-radius: 10px; padding: 16px; }
.account-tile span, .order-section span { display: block; color: #7c8794; font-size: 13px; margin-bottom: 6px; }
.account-tile strong { display: block; font-size: 20px; font-weight: 800; }
.account-tile .amount { font-size: 26px; }
.account-tile small, .account-tile p { margin: 8px 0 0; color: #111827; font-size: 14px; }
.content-grid { display: grid; grid-template-columns: minmax(0, 2fr) 390px; gap: 24px; }
.section-card { border: 1px solid #e5eaf0; border-radius: 12px; background: #fff; }
.section-head { padding: 22px 24px; border-bottom: 1px solid #eef1f5; }
.section-head h2 { margin: 0 0 8px; font-size: 18px; font-weight: 800; }
.section-head p { margin: 0; color: #7c8794; }
.package-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; padding: 22px 24px; }
.package-item { height: 86px; padding: 16px; border: 1px solid #e5eaf0; border-radius: 10px; background: #fff; text-align: left; cursor: pointer; }
.package-item.active { border-color: #2b7fff; box-shadow: 0 0 0 1px #2b7fff inset; }
.package-item strong { display: block; font-size: 22px; margin-bottom: 8px; }
.package-item span, .package-item small { color: #7c8794; font-size: 13px; }
.custom-item { cursor: default; }
.custom-input { margin: 8px 0; }
.notice-box, .bottom-tip { display: flex; gap: 14px; align-items: flex-start; margin: 0 24px 22px; padding: 16px; background: #f1f1f3; color: #6b7280; }
.notice-icon, .bottom-tip span { width: 24px; height: 24px; border-radius: 50%; background: #9ca3af; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; flex: 0 0 auto; }
.notice-box strong { display: block; margin-bottom: 8px; color: #6b7280; }
.notice-box p { margin: 4px 0; }
.order-section { padding: 24px; }
.order-section strong { display: block; font-size: 26px; margin-bottom: 28px; }
.order-section label { display: block; margin-bottom: 12px; color: #374151; }
.pay-method { height: 42px; border: 1px solid #2b7fff; border-radius: 4px; display: flex; align-items: center; gap: 10px; padding: 0 14px; color: #2b7fff; margin-bottom: 24px; }
.radio-dot { width: 14px; height: 14px; border-radius: 50%; background: #409eff; position: relative; }
.radio-dot::after { content: ''; position: absolute; inset: 5px; background: #fff; border-radius: 50%; }
.buy-btn { width: 100%; height: 44px; border: 0; border-radius: 4px; background: #111827; color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; }
.bottom-tip { margin: 24px 0 0; align-items: center; }
</style>
