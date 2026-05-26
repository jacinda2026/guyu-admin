<template>
  <div class="sources-container">
    
    <div class="filter-toolbar">
      <div class="left-actions">
        <el-select v-model="filterForm.model" placeholder="所有模型" style="width: 160px;">
          <el-option label="所有模型" value="all" />
          <el-option label="豆包大模型" value="doubao" />
          <el-option label="DeepSeek" value="deepseek" />
          <el-option label="文心一言" value="ernie" />
        </el-select>
        
        <el-radio-group v-model="filterForm.timeRange" class="ml-16">
          <el-radio-button label="7d">近7天</el-radio-button>
          <el-radio-button label="30d">近30天</el-radio-button>
          <el-radio-button label="custom">自定义</el-radio-button>
        </el-radio-group>
      </div>
      <div class="right-actions">
        <el-button plain><el-icon><Download /></el-icon> 导出</el-button>
      </div>
    </div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="8">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-title">AI模型引用信源数</div>
          <div class="kpi-value">10,346</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-title">信源平台数</div>
          <div class="kpi-value">127</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-title">信源样本数</div>
          <div class="kpi-value">1380</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="mb-20 section-card source-card">
      <template #header><div class="section-title"><el-icon><DataAnalysis /></el-icon> 数据源</div></template>

      <div class="source-switch-row mb-12">
        <el-radio-group v-model="sourceTab" size="small">
          <el-radio-button label="domain">域名</el-radio-button>
          <el-radio-button label="media">链接</el-radio-button>
        </el-radio-group>
      </div>

      <template v-if="sourceTab === 'domain'">
        <div class="source-control-row mb-16">
          <div class="source-control-left">
            <el-select v-model="domainFilter" size="small" style="width: 110px;">
              <el-option label="全部域名" value="all" />
              <el-option label="医疗垂直媒体" value="医疗垂直媒体" />
              <el-option label="医疗行业网站" value="医疗行业网站" />
              <el-option label="健康媒体" value="健康媒体" />
              <el-option label="官网" value="官网" />
            </el-select>
            <span class="aggregate-label">按域名聚合</span>
            <el-switch v-model="domainAggregate" size="small" />
          </div>
          <el-button size="small" plain><el-icon><Download /></el-icon> 导出</el-button>
        </div>

        <template v-if="domainAggregate">
          <el-table
            :data="filteredDomainGroupTable"
            style="width: 100%"
            size="small"
            :header-cell-style="{background:'#f8fafc', color:'#64748b'}"
            class="domain-aggregate-table"
            :row-class-name="domainRowClassName"
            :row-style="domainRowStyle"
            :cell-style="domainCellStyle"
            :cell-class-name="domainCellClassName"
            :key="`domain-aggregate-${domainAggregate}-${filteredDomainGroupTable.length}`"
          >
            <el-table-column prop="rank" label="#" width="48" align="center">
              <template #default="{row}">
                <span v-if="!row.isChild">{{ row.rank }}</span>
              </template>
            </el-table-column>
            <el-table-column label="域名" min-width="520" show-overflow-tooltip>
              <template #default="{row}">
                <div class="domain-tree-cell" :class="{'is-child': row.isChild}">
                  <span v-if="row.isChild" class="tree-guide">|-</span>
                  <span class="media-dot"></span>
                  <div class="domain-tree-text">
                    <div class="domain-tree-title" :title="row.title">{{ row.title }}</div>
                    <div v-if="row.url" class="media-url" :title="row.url">{{ row.url }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="类型" width="160">
              <template #default="{row}">
                <el-tag :type="row.tagType" size="small" effect="plain" class="rounded-tag">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="mentionCount" label="提及数" width="90" align="right" sortable />
            <el-table-column prop="usageCount" label="使用总量" width="100" align="right" sortable />
            <el-table-column prop="avgReference" label="平均引用数" width="110" align="right" sortable />
          </el-table>
        </template>

        <template v-else>
          <el-row :gutter="24">
            <el-col :span="16">
              <el-table :data="filteredDomainTable" style="width: 100%" size="small" :header-cell-style="{background:'#f8fafc', color:'#64748b'}">
                <el-table-column prop="rank" label="#" width="50" align="center" />
                <el-table-column prop="name" label="名称" width="100">
                  <template #default="{row}"><span class="text-muted">{{row.name}}</span></template>
                </el-table-column>
                <el-table-column prop="domain" label="来源" min-width="160" show-overflow-tooltip>
                  <template #default="{row}"><span class="domain-text">{{row.domain}}</span></template>
                </el-table-column>
                <el-table-column label="类型" width="120">
                  <template #default="{row}">
                    <el-tag :type="row.tagType" size="small" effect="plain" class="rounded-tag">{{row.type}}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="quoteCount" label="引用次数" width="90" align="right" />
                <el-table-column prop="quoteRate" label="引用率" width="80" align="right" />
                <el-table-column prop="avgIndex" label="平均引用指数" width="100" align="right" />
              </el-table>
            </el-col>

            <el-col :span="8">
              <div class="chart-wrapper">
                <h4 class="chart-title">来源类型</h4>
                <div ref="donutChartRef" style="height: 280px; width: 100%;"></div>
              </div>
            </el-col>
          </el-row>
        </template>
      </template>

      <template v-else>
        <div class="media-source-panel">
          <div class="media-filter-row mb-12">
            <div class="media-filter-left">
              <el-select v-model="mediaFilter" size="small" style="width: 110px;">
                <el-option label="全部媒体" value="all" />
                <el-option label="汽车媒体" value="汽车媒体" />
                <el-option label="消费媒体" value="消费媒体" />
                <el-option label="社交论坛" value="社交论坛" />
                <el-option label="官网" value="官网" />
              </el-select>
              <span class="aggregate-label">按媒体聚合</span>
              <el-switch v-model="mediaAggregate" size="small" />
            </div>
            <el-button size="small" plain><el-icon><Download /></el-icon> 导出</el-button>
          </div>

          <el-table
            :data="mediaAggregate ? filteredMediaGroupTable : filteredMediaTable"
            style="width: 100%"
            size="small"
            :header-cell-style="{background:'#f8fafc', color:'#64748b'}"
            :row-class-name="mediaAggregate ? mediaRowClassName : undefined"
            :row-style="mediaAggregate ? mediaRowStyle : undefined"
            :cell-style="mediaAggregate ? mediaCellStyle : {height:'44px'}"
            :cell-class-name="mediaAggregate ? mediaCellClassName : undefined"
            :class="mediaAggregate ? 'media-aggregate-table' : ''"
            :key="`media-${mediaAggregate ? 'aggregate' : 'flat'}-${filteredMediaTable.length}`"
          >
            <el-table-column prop="rank" label="#" width="48" align="center">
              <template #default="{row}">
                <span v-if="!mediaAggregate || !row.isChild">{{ row.rank }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="mediaAggregate ? '媒体' : '媒体/链接'" min-width="470" show-overflow-tooltip>
              <template #default="{row}">
                <div class="media-link-cell" :class="{'is-child': mediaAggregate && row.isChild}">
                  <span v-if="mediaAggregate && row.isChild" class="tree-guide">|-</span>
                  <span class="media-dot"></span>
                  <div class="media-link-text">
                    <div class="media-title" :title="row.title">{{ row.title }}</div>
                    <div v-if="row.url" class="media-url" :title="row.url">{{ row.url }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="类型" width="160">
              <template #default="{row}">
                <el-tag :type="row.tagType" size="small" effect="plain" class="rounded-tag">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="mentionCount" label="提及数" width="90" align="right" sortable />
            <el-table-column prop="usageCount" label="使用总数" width="100" align="right" sortable />
            <el-table-column prop="avgReference" label="平均引用数" width="110" align="right" sortable />
          </el-table>
        </div>
      </template>
    </el-card>

    <div class="section-title mb-16 mt-24">各AI模型信源 TOP 10</div>
    <el-row :gutter="16" class="mb-20">
      <el-col :span="6" v-for="(model, idx) in currentTop10Models" :key="idx">
        <div class="top10-card">
          <div class="t-header" :class="model.theme">
            <el-icon><Platform /></el-icon>
            {{ model.name }} <span class="t-count">({{ model.count }}条信源)</span>
          </div>
          <div class="t-list">
            <div class="t-item" v-for="(item, i) in model.list" :key="i">
              <div class="t-rank">{{ i + 1 }}.</div>
              <div class="t-source">
                <div class="t-source-title text-truncate" :title="item.title || item.domain">{{ item.title || item.domain }}</div>
                <div v-if="sourceTab === 'media' && item.url" class="t-source-url text-truncate" :title="item.url">{{ item.url }}</div>
              </div>
              <div class="t-val">
                <span class="t-count-num">{{ item.count }}</span>
                <span class="t-count-label">引用</span>
                <span class="t-grade" :class="'g-'+item.grade">{{ item.grade }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-card shadow="never" class="section-card mt-24">
      <template #header><div class="section-title">信源等级分布</div></template>
      <el-table :data="gradeTableData" style="width: 100%" :header-cell-style="{background:'#1d4ed8', color:'#fff'}">
        <el-table-column label="信源等级" width="120" align="center">
          <template #default="{row}"><strong :class="'grade-text-'+row.grade">{{row.grade}}级</strong></template>
        </el-table-column>
        <el-table-column prop="desc" label="描述" min-width="180" />
        <el-table-column prop="sampleCount" label="样本数量" align="center" />
        <el-table-column prop="percent" label="占比" align="center" />
        <el-table-column label="GEO价值" align="center">
          <template #default="{row}">
            <el-tag :type="row.valType" effect="dark" size="small" style="border-radius: 12px; padding: 0 14px;">{{row.value}}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { Download, DataAnalysis, Platform } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const filterForm = reactive({
  model: 'all',
  timeRange: '7d'
})

const sourceTab = ref('domain')
const sourceSearch = ref('')
const domainFilter = ref('all')
const domainAggregate = ref(false)
const mediaFilter = ref('all')
const mediaAggregate = ref(false)

// 模拟数据源表格数据
const dataSourceTable = ref([
  { rank: 1, name: '-', domain: 'Other', type: '其他', tagType: 'danger', quoteCount: 45, quoteRate: '45%', avgIndex: '0.0' },
  { rank: 2, name: '新京报', domain: 'm.bjnews.com.cn', type: '新闻媒体', tagType: 'success', quoteCount: 10, quoteRate: '10%', avgIndex: '8.9' },
  { rank: 3, name: 'example.com', domain: 'example.com', type: '消费评测社区', tagType: '', quoteCount: 8, quoteRate: '8%', avgIndex: '7.4' },
  { rank: 4, name: '薄荷医生', domain: 'm.bohe.cn', type: '医疗健康平台', tagType: 'warning', quoteCount: 7, quoteRate: '7%', avgIndex: '6.8' },
  { rank: 5, name: '什么值得买', domain: 'post.smzdm.com', type: '消费评测社区', tagType: '', quoteCount: 5, quoteRate: '5%', avgIndex: '7.5' },
  { rank: 6, name: '央视网', domain: 'www.bjnews.com.cn', type: '新闻媒体', tagType: 'success', quoteCount: 5, quoteRate: '5%', avgIndex: '9.1' },
  { rank: 7, name: '未提供', domain: '未提供', type: '未提供', tagType: 'info', quoteCount: 5, quoteRate: '5%', avgIndex: '2.0' },

])


// 域名聚合表格数据：开启“按域名聚合”后展示域名父级 + 链接子级的树状视觉
const domainGroupTable = ref([
  { rank: 1, title: '010yt.com', url: '', type: '医美垂直媒体', tagType: '', mentionCount: 0, usageCount: 4, avgReference: '0.0' },
  { title: '深圳市中医院医疗美容科嫩肤价格表(价目表)-口碑怎么样-评价-地址在...', url: 'https://m.010yt.com/hospital/slajkddd13/', type: '医美垂直媒体', tagType: '', mentionCount: 0, usageCount: 2, avgReference: '0.0', isChild: true },
  { title: '深圳市中医院医疗美容科嫩肤怎么样技术好不好口碑评价-侧妍整形网', url: 'https://www.010yt.com/hospital/slajkddd13/introduce', type: '医美垂直媒体', tagType: '', mentionCount: 0, usageCount: 1, avgReference: '0.0', isChild: true },
  { title: '深圳中医院整形科怎么样价格表正规吗评价怎么样好不好--侧妍整形网', url: 'https://www.010yt.com/hospital/szzyyzzxk23/credit', type: '医美垂直媒体', tagType: '', mentionCount: 0, usageCount: 1, avgReference: '0.0', isChild: true },

  { rank: 2, title: '178yy.com', url: '', type: '医疗行业网站', tagType: 'success', mentionCount: 0, usageCount: 1, avgReference: '0.0' },
  { title: '广州老中医坐诊哪里好?广州哪里看中医比较好?-大千医药招商网', url: 'https://www.178yy.com/wenzhang/show.asp?ID=69148', type: '医疗行业网站', tagType: 'success', mentionCount: 0, usageCount: 1, avgReference: '0.0', isChild: true },

  { rank: 3, title: '2500sz.com', url: '', type: '地方新闻媒体', tagType: 'warning', mentionCount: 1, usageCount: 1, avgReference: '1.0' },
  { title: '苏州这两家医院，“上新”！', url: 'https://news.2500sz.com/doc/2025/09/21/1171926.shtml', type: '地方新闻媒体', tagType: 'warning', mentionCount: 1, usageCount: 1, avgReference: '1.0', isChild: true },

  { rank: 4, title: '35jk.com', url: '', type: '医疗健康平台', tagType: '', mentionCount: 1, usageCount: 1, avgReference: '1.0' },
  { title: '青雪梅_中国中医科学院广安门医院主任医师_青雪梅预约挂号_电话_怎...', url: 'https://www.35jk.com/11/expert/20258.html', type: '医疗健康平台', tagType: '', mentionCount: 1, usageCount: 1, avgReference: '1.0', isChild: true },

  { rank: 5, title: '39.108.215.1', url: '', type: '官网', tagType: 'info', mentionCount: 1, usageCount: 1, avgReference: '1.0' },
  { title: '国医馆', url: 'http://39.108.215.1/gyg.html', type: '官网', tagType: 'info', mentionCount: 1, usageCount: 1, avgReference: '1.0', isChild: true },

  { rank: 6, title: '39.net', url: '', type: '健康媒体', tagType: 'danger', mentionCount: 12, usageCount: 11, avgReference: '0.4' },
  { title: '倦怠乏力别硬扛！老中医郭福新的“调补气血”调理方', url: 'https://m.39.net/cm/a_z3w2cv5.html', type: '健康垂直媒体', tagType: '', mentionCount: 3, usageCount: 2, avgReference: '0.7', isChild: true },
  { title: '在广州那一家医院看中医减肥最靠谱-广州中医减肥医院排行榜单前十...', url: 'https://yyk.39.net/gz/ec4c4/news/rudocutj.html', type: '医疗健康平台', tagType: '', mentionCount: 5, usageCount: 1, avgReference: '0.2', isChild: true },
  { title: '苏州老中医王重卿：高血压中医辨证缓头晕防并发症', url: 'https://wapyyk.39.net/sz/1035937/news/ftkoo8o0.html', type: '医疗健康平台', tagType: '', mentionCount: 2, usageCount: 1, avgReference: '0.5', isChild: true },
  { title: '上海中医治疗高血压专家推荐|上海切爱益正堂中医门诊部业务院长陈...', url: 'https://disease.39.net/shxayy/260127/y5wdlba.html', type: '健康媒体', tagType: 'danger', mentionCount: 1, usageCount: 1, avgReference: '1.0', isChild: true },
  { title: '苏州哪里看亚健康疲劳好？刘晋云“三维调理”精油芳疗焕能方案', url: 'https://m.39.net/cm/a_howil4.html', type: '健康垂直媒体', tagType: '', mentionCount: 1, usageCount: 1, avgReference: '1.0', isChild: true },
  { title: '广州焦虑症治疗效果排名', url: 'https://wapjbk.39.net/yiyuanfengcai/tsyl_gznbsyy/6klnflm/', type: '健康媒体', tagType: 'danger', mentionCount: 0, usageCount: 1, avgReference: '0.0', isChild: true },
  { title: '广州焦虑症哪家治疗的好', url: 'https://wapyyk.39.net/gz/52c63/news/66vndu9f.html', type: '健康媒体', tagType: 'danger', mentionCount: 0, usageCount: 1, avgReference: '0.0', isChild: true },
  { title: '广州哪个治疗焦虑症的医院好', url: 'https://wapyyk.39.net/gz/5420b/news/n3u4ouu9.html', type: '健康媒体', tagType: 'danger', mentionCount: 0, usageCount: 1, avgReference: '0.0', isChild: true },
  { title: '深圳皮肤病治疗哪个医院', url: 'https://wapyyk.39.net/sz/116050/news/t9ami1a3.html', type: '医疗健康平台', tagType: '', mentionCount: 0, usageCount: 1, avgReference: '0.0', isChild: true },
  { title: '苏州哪里有治疗内分泌失调的老中医？苏州内分泌治疗哪里比较好?', url: 'https://wapyyk.39.net/sz/1035937/q314312/', type: '健康资讯平台', tagType: 'danger', mentionCount: 0, usageCount: 1, avgReference: '0.0', isChild: true },

  { rank: 7, title: '3zjp.com', url: '', type: '健康资讯平台', tagType: 'danger', mentionCount: 1, usageCount: 1, avgReference: '1.0' },
  { title: '深圳市中医院皮肤美容科实力如何?该院口碑详情!附医生名单_特色项目', url: 'https://m.3zjp.com/zixun/8216.html', type: '健康资讯平台', tagType: 'danger', mentionCount: 1, usageCount: 1, avgReference: '1.0', isChild: true },

  { rank: 8, title: '483.cn', url: '', type: '健康垂直媒体', tagType: '', mentionCount: 1, usageCount: 1, avgReference: '1.0' },
  { title: '苏州老中医孙素芹主任：以中医整体观调和阴阳失衡，破除肾虚困局', url: 'http://phone.483.cn/FgSensitiveWords/badcheck.php?url=https%3A%2F%2...', type: '健康垂直媒体', tagType: '', mentionCount: 1, usageCount: 1, avgReference: '1.0', isChild: true }
])

// 媒体页签表格数据：切换到“媒体”后展示产品原型里的媒体/链接明细
const mediaSourceTable = ref([
  { rank: 1, title: '太平洋汽车网车主口碑与评测数据库', url: 'https://www.pcauto.com.cn/', type: '汽车媒体', tagType: '', mentionCount: 3, usageCount: 25, avgReference: '8.3' },
  { rank: 2, title: '2026年3月百名车主评测车质报告', url: 'https://www.12365auto.com/', type: '汽车媒体', tagType: '', mentionCount: 2, usageCount: 13, avgReference: '6.5' },
  { rank: 3, title: '坦克300深度实测：电子系统与四驱可靠性专项评测', url: 'https://www.dongchedi.com/', type: '汽车媒体', tagType: '', mentionCount: 3, usageCount: 8, avgReference: '2.7' },
  { rank: 4, title: '硬派新能源SUV质量横向对比：钛7 vs 猛龙 vs M9', url: 'https://www.yiche.com/', type: '汽车媒体', tagType: '', mentionCount: 3, usageCount: 8, avgReference: '2.7' },
  { rank: 5, title: '方程豹钛7深度体验：性能与品控的双面体', url: 'https://www.youjia.com/', type: '汽车媒体', tagType: '', mentionCount: 2, usageCount: 6, avgReference: '3.0' },
  { rank: 6, title: '方程豹钛7用户投诉分析专题（2026年4月更新）', url: 'https://www.autohome.com.cn/', type: '汽车媒体', tagType: '', mentionCount: 1, usageCount: 5, avgReference: '5.0' },
  { rank: 7, title: '坦克300车主真实用车体验合集', url: 'https://www.xiaohongshu.com/', type: '社交论坛', tagType: 'success', mentionCount: 1, usageCount: 5, avgReference: '5.0' },
  { rank: 8, title: '2026年方盒子SUV横向评测：牧马人vs钛7核心维度对比', url: 'https://www.58che.com/', type: '汽车媒体', tagType: '', mentionCount: 2, usageCount: 4, avgReference: '2.0' },
  { rank: 9, title: '懂车帝2026春季车型评测', url: 'https://www.dongchedi.com/article/20260415123456789', type: '汽车媒体', tagType: '', mentionCount: 2, usageCount: 4, avgReference: '2.0' },
  { rank: 10, title: '汽车之家权威实测与车主调研数据', url: 'https://www.autohome.com.cn/', type: '汽车媒体', tagType: '', mentionCount: 1, usageCount: 4, avgReference: '4.0' },
  { rank: 11, title: '车讯网用户口碑与质量报告', url: 'https://www.12365auto.com/', type: '汽车媒体', tagType: '', mentionCount: 1, usageCount: 3, avgReference: '3.0' },
  { rank: 12, title: '方程豹钛7产品技术白皮书（2026版）', url: 'https://www.fangchengbao.com/', type: '官网', tagType: 'info', mentionCount: 1, usageCount: 3, avgReference: '3.0' }
])

const filteredDomainTable = computed(() => {
  const keyword = sourceSearch.value.trim().toLowerCase()
  if (!keyword) return dataSourceTable.value
  return dataSourceTable.value.filter(item =>
    [item.name, item.domain, item.type].some(value => String(value).toLowerCase().includes(keyword))
  )
})


const filteredDomainGroupTable = computed(() => {
  let list = domainGroupTable.value
  if (domainFilter.value !== 'all') {
    list = list.filter(item => item.type === domainFilter.value || item.isChild)
  }
  const keyword = sourceSearch.value.trim().toLowerCase()
  if (keyword) {
    list = list.filter(item =>
      [item.title, item.url, item.type].some(value => String(value).toLowerCase().includes(keyword))
    )
  }
  return list
})

const domainRowClassName = ({ row }) => row.isChild ? 'domain-child-row' : 'domain-parent-row'

const domainRowStyle = ({ row }) => ({
  backgroundColor: row.isChild ? '#fff' : '#f6f7f9'
})

const domainCellClassName = ({ row }) => row.isChild ? 'domain-child-cell' : 'domain-parent-cell'

const domainCellStyle = ({ row }) => ({
  height: row.isChild ? '42px' : '44px',
  backgroundColor: row.isChild ? '#fff' : '#f6f7f9',
  fontWeight: row.isChild ? 400 : 600
})

const getMediaHost = (url = '') => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch (e) {
    return url || '未知媒体'
  }
}

const getMediaDisplayName = (host = '') => {
  const mediaNameMap = {
    'pcauto.com.cn': '太平洋汽车网',
    '12365auto.com': '车质网',
    'dongchedi.com': '懂车帝',
    'yiche.com': '易车网',
    'youjia.com': '有驾',
    'autohome.com.cn': '汽车之家',
    'xiaohongshu.com': '小红书',
    '58che.com': '58汽车',
    'fangchengbao.com': '方程豹官网'
  }
  return mediaNameMap[host] || host
}

const filteredMediaTable = computed(() => {
  let list = mediaSourceTable.value
  if (mediaFilter.value !== 'all') {
    list = list.filter(item => item.type === mediaFilter.value)
  }
  const keyword = sourceSearch.value.trim().toLowerCase()
  if (keyword) {
    list = list.filter(item =>
      [item.title, item.url, item.type].some(value => String(value).toLowerCase().includes(keyword))
    )
  }
  return list
})

const filteredMediaGroupTable = computed(() => {
  const groupMap = new Map()

  filteredMediaTable.value.forEach(item => {
    const host = getMediaHost(item.url)
    if (!groupMap.has(host)) {
      groupMap.set(host, {
        host,
        children: [],
        mentionCount: 0,
        usageCount: 0,
        typeCount: {},
        tagTypeCount: {}
      })
    }

    const group = groupMap.get(host)
    group.children.push({ ...item, isChild: true })
    group.mentionCount += Number(item.mentionCount || 0)
    group.usageCount += Number(item.usageCount || 0)
    group.typeCount[item.type] = (group.typeCount[item.type] || 0) + 1
    group.tagTypeCount[item.tagType || ''] = (group.tagTypeCount[item.tagType || ''] || 0) + 1
  })

  return Array.from(groupMap.values())
    .sort((a, b) => b.usageCount - a.usageCount)
    .flatMap((group, index) => {
      const mainType = Object.entries(group.typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
      const mainTagType = Object.entries(group.tagTypeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
      const parent = {
        rank: index + 1,
        title: getMediaDisplayName(group.host),
        url: '',
        type: mainType,
        tagType: mainTagType,
        mentionCount: group.mentionCount,
        usageCount: group.usageCount,
        avgReference: group.mentionCount ? (group.usageCount / group.mentionCount).toFixed(1) : '0.0'
      }
      return [parent, ...group.children]
    })
})

const mediaRowClassName = ({ row }) => row.isChild ? 'media-child-row' : 'media-parent-row'

const mediaRowStyle = ({ row }) => ({
  backgroundColor: row.isChild ? '#fff' : '#f6f7f9'
})

const mediaCellClassName = ({ row }) => row.isChild ? 'media-child-cell' : 'media-parent-cell'

const mediaCellStyle = ({ row }) => ({
  height: row.isChild ? '42px' : '44px',
  backgroundColor: row.isChild ? '#fff' : '#f6f7f9',
  fontWeight: row.isChild ? 400 : 600
})

// 模拟 Top 10 模型信源数据
const top10Models = ref([
  {
    name: '混元', count: 768, theme: 'bg-blue',
    list: [ { domain: 'baijiahao.baidu.com', count: 202, grade: 'C' }, { domain: 'k.sina.cn', count: 36, grade: 'C' }, { domain: 'www.toutiao.com', count: 26, grade: 'C' }, { domain: '排行榜123网', count: 22, grade: 'A' }, { domain: 'mbd.baidu.com', count: 21, grade: 'C' }, { domain: '百度健康', count: 19, grade: 'B' }, { domain: '十大品牌网', count: 18, grade: 'A' }, { domain: '新浪财经', count: 16, grade: 'A' }, { domain: '腾讯新闻', count: 14, grade: 'A' }, { domain: '什么值得买', count: 12, grade: 'B' } ]
  },
  {
    name: '豆包', count: 500, theme: 'bg-blue-light',
    list: [ { domain: '买购网', count: 48, grade: 'A' }, { domain: '手机搜狐网', count: 42, grade: 'A' }, { domain: '陕西法制网', count: 38, grade: 'A' }, { domain: '邻步荟方', count: 26, grade: 'A' }, { domain: '什么值得买社区', count: 24, grade: 'B' }, { domain: '新浪财经', count: 20, grade: 'A' }, { domain: '腾讯网', count: 18, grade: 'A' }, { domain: '网易新闻', count: 16, grade: 'A' }, { domain: '百度健康', count: 15, grade: 'B' }, { domain: '十大品牌网', count: 13, grade: 'A' } ]
  },
  {
    name: 'DeepSeek', count: 435, theme: 'bg-indigo',
    list: [ { domain: '买购网', count: 43, grade: 'A' }, { domain: '手机搜狐网', count: 42, grade: 'A' }, { domain: '新浪看点', count: 37, grade: 'A' }, { domain: '新浪新闻', count: 28, grade: 'A' }, { domain: '腾讯网', count: 24, grade: 'A' }, { domain: '十大品牌网CNPP', count: 24, grade: 'A' }, { domain: '百度健康', count: 21, grade: 'B' }, { domain: '网易新闻', count: 18, grade: 'A' }, { domain: '今日头条', count: 16, grade: 'C' }, { domain: '什么值得买', count: 14, grade: 'B' } ]
  },
  {
    name: '文心一言', count: 225, theme: 'bg-blue',
    list: [ { domain: '中国黄酒排名前十名短视频...', count: 13, grade: 'C' }, { domain: '究竟哪个牌子正宗?羊奶调查...', count: 11, grade: 'C' }, { domain: '那些哪个牌子羊奶粉好2025...', count: 10, grade: 'C' }, { domain: '腾讯新闻 2026年4月22日', count: 7, grade: 'C' }, { domain: '2025年黄酒十大品牌排行榜', count: 6, grade: 'A' }, { domain: '百度百家号测评内容', count: 6, grade: 'C' }, { domain: '搜狐网行业资讯', count: 5, grade: 'A' }, { domain: '新浪新闻品牌报道', count: 5, grade: 'A' }, { domain: '知乎用户讨论', count: 4, grade: 'B' }, { domain: '什么值得买社区', count: 4, grade: 'B' } ]
  }
])

// 链接页签下的各 AI 模型信源 TOP 10：展示具体媒体/链接、引用总数、信源等级
const mediaTop10Models = ref([
  {
    name: '混元', count: 84, theme: 'bg-blue',
    list: [
      { title: '太平洋汽车网车主口碑与评测数据库', url: 'https://www.pcauto.com.cn/', count: 25, grade: 'A' },
      { title: '2026年3月百名车主评测车质报告', url: 'https://www.12365auto.com/', count: 13, grade: 'A' },
      { title: '坦克300深度实测：电子系统与四驱可靠性专项评测', url: 'https://www.dongchedi.com/', count: 8, grade: 'B' },
      { title: '硬派新能源SUV质量横向对比：钛7 vs 猛龙 vs M9', url: 'https://www.yiche.com/', count: 8, grade: 'B' },
      { title: '方程豹钛7深度体验：性能与品控的双面体', url: 'https://www.youjia.com/', count: 6, grade: 'B' },
      { title: '方程豹钛7用户投诉分析专题（2026年4月更新）', url: 'https://www.autohome.com.cn/', count: 5, grade: 'A' },
      { title: '坦克300车主真实用车体验合集', url: 'https://www.xiaohongshu.com/', count: 5, grade: 'B' },
      { title: '2026年方盒子SUV横向评测：牧马人vs钛7核心维度对比', url: 'https://www.58che.com/', count: 4, grade: 'B' },
      { title: '懂车帝2026春季车型评测', url: 'https://www.dongchedi.com/article/20260415123456789', count: 4, grade: 'B' },
      { title: '汽车之家权威实测与车主调研数据', url: 'https://www.autohome.com.cn/', count: 4, grade: 'A' }
    ]
  },
  {
    name: '豆包', count: 67, theme: 'bg-blue-light',
    list: [
      { title: '2026年3月百名车主评测车质报告', url: 'https://www.12365auto.com/', count: 16, grade: 'A' },
      { title: '太平洋汽车网车主口碑与评测数据库', url: 'https://www.pcauto.com.cn/', count: 14, grade: 'A' },
      { title: '汽车之家权威实测与车主调研数据', url: 'https://www.autohome.com.cn/', count: 9, grade: 'A' },
      { title: '懂车帝2026春季车型评测', url: 'https://www.dongchedi.com/article/20260415123456789', count: 7, grade: 'B' },
      { title: '方程豹钛7产品技术白皮书（2026版）', url: 'https://www.fangchengbao.com/', count: 6, grade: 'S' },
      { title: '车讯网用户口碑与质量报告', url: 'https://www.12365auto.com/', count: 5, grade: 'B' },
      { title: '方程豹钛7深度体验：性能与品控的双面体', url: 'https://www.youjia.com/', count: 4, grade: 'B' },
      { title: '坦克300车主真实用车体验合集', url: 'https://www.xiaohongshu.com/', count: 3, grade: 'B' },
      { title: '硬派新能源SUV质量横向对比：钛7 vs 猛龙 vs M9', url: 'https://www.yiche.com/', count: 2, grade: 'B' },
      { title: '2026年方盒子SUV横向评测：牧马人vs钛7核心维度对比', url: 'https://www.58che.com/', count: 1, grade: 'C' }
    ]
  },
  {
    name: 'DeepSeek', count: 59, theme: 'bg-indigo',
    list: [
      { title: '坦克300深度实测：电子系统与四驱可靠性专项评测', url: 'https://www.dongchedi.com/', count: 12, grade: 'B' },
      { title: '太平洋汽车网车主口碑与评测数据库', url: 'https://www.pcauto.com.cn/', count: 11, grade: 'A' },
      { title: '硬派新能源SUV质量横向对比：钛7 vs 猛龙 vs M9', url: 'https://www.yiche.com/', count: 8, grade: 'B' },
      { title: '汽车之家权威实测与车主调研数据', url: 'https://www.autohome.com.cn/', count: 7, grade: 'A' },
      { title: '方程豹钛7用户投诉分析专题（2026年4月更新）', url: 'https://www.autohome.com.cn/', count: 5, grade: 'A' },
      { title: '2026年3月百名车主评测车质报告', url: 'https://www.12365auto.com/', count: 5, grade: 'A' },
      { title: '懂车帝2026春季车型评测', url: 'https://www.dongchedi.com/article/20260415123456789', count: 4, grade: 'B' },
      { title: '坦克300车主真实用车体验合集', url: 'https://www.xiaohongshu.com/', count: 3, grade: 'B' },
      { title: '车讯网用户口碑与质量报告', url: 'https://www.12365auto.com/', count: 2, grade: 'B' },
      { title: '方程豹钛7产品技术白皮书（2026版）', url: 'https://www.fangchengbao.com/', count: 2, grade: 'S' }
    ]
  },
  {
    name: '文心一言', count: 42, theme: 'bg-blue',
    list: [
      { title: '太平洋汽车网车主口碑与评测数据库', url: 'https://www.pcauto.com.cn/', count: 10, grade: 'A' },
      { title: '2026年3月百名车主评测车质报告', url: 'https://www.12365auto.com/', count: 8, grade: 'A' },
      { title: '方程豹钛7产品技术白皮书（2026版）', url: 'https://www.fangchengbao.com/', count: 6, grade: 'S' },
      { title: '汽车之家权威实测与车主调研数据', url: 'https://www.autohome.com.cn/', count: 5, grade: 'A' },
      { title: '硬派新能源SUV质量横向对比：钛7 vs 猛龙 vs M9', url: 'https://www.yiche.com/', count: 4, grade: 'B' },
      { title: '坦克300车主真实用车体验合集', url: 'https://www.xiaohongshu.com/', count: 3, grade: 'B' },
      { title: '方程豹钛7深度体验：性能与品控的双面体', url: 'https://www.youjia.com/', count: 2, grade: 'B' },
      { title: '懂车帝2026春季车型评测', url: 'https://www.dongchedi.com/article/20260415123456789', count: 2, grade: 'B' },
      { title: '2026年方盒子SUV横向评测：牧马人vs钛7核心维度对比', url: 'https://www.58che.com/', count: 1, grade: 'C' },
      { title: '车讯网用户口碑与质量报告', url: 'https://www.12365auto.com/', count: 1, grade: 'B' }
    ]
  }
])

const currentTop10Models = computed(() => sourceTab.value === 'media' ? mediaTop10Models.value : top10Models.value)

// 模拟信源等级分布表格数据
const gradeTableData = ref([
  { grade: 'S', desc: '国家级官方媒体', sampleCount: 1, percent: '0.0%', valType: 'success', value: '极高' },
  { grade: 'A', desc: '省级媒体/综合门户', sampleCount: 595, percent: '33.5%', valType: 'success', value: '高' },
  { grade: 'B', desc: '垂直平台/消费决策', sampleCount: 141, percent: '5.8%', valType: 'warning', value: '中' },
  { grade: 'C', desc: '普通淘分资讯', sampleCount: 1038, percent: '52.4%', valType: 'danger', value: '低' },
])

// ECharts 初始化
const donutChartRef = ref(null)
let donutChartInst = null
const handleResize = () => donutChartInst?.resize()

const initCharts = () => {
  if (donutChartRef.value) {
    donutChartInst?.dispose()
    donutChartInst = echarts.init(donutChartRef.value)
    donutChartInst.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: '0%', left: 'center', icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11, color: '#64748b' } },
      color: ['#3b82f6', '#10b981', '#06b6d4', '#8b5cf6', '#94a3b8', '#f59e0b', '#f43f5e'],
      series: [
        {
          name: '来源类型',
          type: 'pie',
          radius: ['55%', '70%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: 'center',
            formatter: () => '{v|473}\n{t|引用数}',
            rich: { v: { fontSize: 28, fontWeight: 'bold', color: '#111827', padding: [0,0,4,0] }, t: { fontSize: 12, color: '#64748b' } }
          },
          labelLine: { show: false },
          data: [
            { value: 140, name: '新闻媒体' }, { value: 100, name: '消费评测社区' },
            { value: 80, name: '垂直资讯网站' }, { value: 60, name: '医疗健康平台' },
            { value: 45, name: '未提供' }, { value: 30, name: '地方新闻门户' }, { value: 18, name: '其他' }
          ]
        }
      ]
    })
  }
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', handleResize)
})

watch(sourceTab, async (tab) => {
  if (tab === 'domain' && !domainAggregate.value) {
    await nextTick()
    initCharts()
  } else {
    donutChartInst?.dispose()
    donutChartInst = null
  }
})

watch(domainAggregate, async (isAggregate) => {
  if (sourceTab.value === 'domain' && !isAggregate) {
    await nextTick()
    initCharts()
  } else {
    donutChartInst?.dispose()
    donutChartInst = null
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  donutChartInst?.dispose()
})
</script>

<style scoped>
.sources-container { padding: 16px 24px 40px; background-color: #f4f6f9; min-height: 100vh; }

/* 顶部筛选条 */
.filter-toolbar { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 16px 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px; }
.left-actions { display: flex; align-items: center; }
.ml-16 { margin-left: 16px; }

/* KPI 卡片 */
.kpi-card { text-align: center; padding: 12px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
.kpi-title { font-size: 13px; color: #64748b; margin-bottom: 8px; }
.kpi-value { font-size: 28px; font-weight: 800; color: #111827; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }

/* 通用区段 */
.section-card { border-radius: 8px; border: 1px solid #e5e7eb; }
.section-title { font-size: 16px; font-weight: bold; color: #1e293b; display: flex; align-items: center; gap: 8px; }
.mb-20 { margin-bottom: 20px; }
.mb-16 { margin-bottom: 16px; }
.mt-24 { margin-top: 24px; }

.mb-12 { margin-bottom: 12px; }
.source-card :deep(.el-card__header) { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; }
.source-card :deep(.el-card__body) { padding: 12px 16px 16px; }
.source-switch-row { display: flex; align-items: center; }
.source-control-row,
.media-filter-row { display: flex; align-items: center; justify-content: space-between; }
.source-control-left,
.media-filter-left { display: flex; align-items: center; gap: 10px; }
.media-source-panel { width: 100%; }
.aggregate-label { font-size: 12px; color: #64748b; }
.media-link-cell,
.domain-tree-cell { display: flex; align-items: center; min-width: 0; }
.domain-tree-cell.is-child,
.media-link-cell.is-child { padding-left: 10px; }
.tree-guide { color: #64748b; font-size: 13px; margin-right: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
.media-dot { width: 14px; height: 14px; border-radius: 50%; background: #e2e8f0; margin-right: 10px; flex: 0 0 auto; }
.media-link-text,
.domain-tree-text { min-width: 0; line-height: 1.25; }
.media-title,
.domain-tree-title { color: #1e293b; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.media-url { color: #64748b; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
.source-card :deep(.domain-parent-row) { background: #f7f7f8; }
.source-card :deep(.domain-child-row) { background: #fff; }
.source-card :deep(.domain-parent-row > td.el-table__cell) { background: #f7f7f8 !important; }
.source-card :deep(.domain-child-row > td.el-table__cell) { background: #fff !important; }
.source-card :deep(.domain-parent-row .domain-tree-title) { font-weight: 600; }
.source-card :deep(.domain-child-row .domain-tree-title) { font-weight: 400; }
.source-card :deep(.domain-parent-row .media-url) { display: none; }
.source-card :deep(.el-table--small .el-table__cell) { padding: 7px 0; }


/* 域名聚合表：强制覆盖 Element Plus 单元格背景，确保开关打开后视觉有变化 */
.source-card :deep(.domain-aggregate-table .domain-parent-row),
.source-card :deep(.domain-aggregate-table .domain-parent-row > td),
.source-card :deep(.domain-aggregate-table .domain-parent-cell),
.source-card :deep(.domain-aggregate-table .domain-parent-cell.el-table__cell),
.source-card :deep(.domain-aggregate-table .domain-parent-cell .cell) { background-color: #f6f7f9 !important; }
.source-card :deep(.domain-aggregate-table .domain-child-row),
.source-card :deep(.domain-aggregate-table .domain-child-row > td),
.source-card :deep(.domain-aggregate-table .domain-child-cell),
.source-card :deep(.domain-aggregate-table .domain-child-cell.el-table__cell),
.source-card :deep(.domain-aggregate-table .domain-child-cell .cell) { background-color: #fff !important; }
.source-card :deep(.domain-aggregate-table .domain-parent-row .domain-tree-title) { font-weight: 700; color: #111827; }
.source-card :deep(.domain-aggregate-table .domain-child-row .domain-tree-title) { font-weight: 400; color: #334155; }
.source-card :deep(.domain-aggregate-table .domain-child-row .cell) { color: #334155; }
.source-card :deep(.domain-aggregate-table .domain-parent-row .media-url) { display: none; }
.source-card :deep(.domain-aggregate-table .domain-child-row .tree-guide) { display: inline-block; width: 16px; text-align: right; }

/* 媒体聚合表：开启“按媒体聚合”后，展示媒体父级 + 链接子级 */
.source-card :deep(.media-aggregate-table .media-parent-row),
.source-card :deep(.media-aggregate-table .media-parent-row > td),
.source-card :deep(.media-aggregate-table .media-parent-cell),
.source-card :deep(.media-aggregate-table .media-parent-cell.el-table__cell),
.source-card :deep(.media-aggregate-table .media-parent-cell .cell) { background-color: #f6f7f9 !important; }
.source-card :deep(.media-aggregate-table .media-child-row),
.source-card :deep(.media-aggregate-table .media-child-row > td),
.source-card :deep(.media-aggregate-table .media-child-cell),
.source-card :deep(.media-aggregate-table .media-child-cell.el-table__cell),
.source-card :deep(.media-aggregate-table .media-child-cell .cell) { background-color: #fff !important; }
.source-card :deep(.media-aggregate-table .media-parent-row .media-title) { font-weight: 700; color: #111827; }
.source-card :deep(.media-aggregate-table .media-child-row .media-title) { font-weight: 400; color: #334155; }
.source-card :deep(.media-aggregate-table .media-child-row .cell) { color: #334155; }
.source-card :deep(.media-aggregate-table .media-parent-row .media-url) { display: none; }
.source-card :deep(.media-aggregate-table .media-child-row .tree-guide) { display: inline-block; width: 16px; text-align: right; }

/* 表格与图表 */
.table-toolbar { display: flex; justify-content: space-between; align-items: center; }
.tb-actions { display: flex; align-items: center; }
.text-muted { color: #94a3b8; }
.domain-text { color: #1e293b; font-family: monospace; }
.rounded-tag { border-radius: 12px; }
.chart-wrapper { background: #f8fafc; border-radius: 8px; padding: 16px; height: 100%; border: 1px solid #f1f5f9; }
.chart-title { margin: 0 0 16px 0; font-size: 14px; color: #334155; text-align: center; }

/* TOP 10 卡片 */
.top10-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
.t-header { padding: 12px 14px; color: #fff; font-size: 14px; font-weight: bold; display: flex; align-items: center; gap: 6px; }
.t-count { font-weight: normal; font-size: 12px; opacity: 0.9; margin-left: auto; }
.bg-blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.bg-blue-light { background: linear-gradient(135deg, #60a5fa, #3b82f6); }
.bg-indigo { background: linear-gradient(135deg, #6366f1, #4f46e5); }
.t-list { padding: 8px 14px 10px; height: auto; min-height: 0; overflow: visible; }
.t-item { display: flex; align-items: center; padding: 7px 0; border-bottom: 1px dashed #f1f5f9; font-size: 12px; }
.t-item:last-child { border-bottom: none; }
.t-rank { width: 24px; color: #94a3b8; font-weight: bold; }
.t-source { flex: 1; min-width: 0; padding-right: 8px; }
.t-source-title { color: #334155; line-height: 1.25; }
.t-source-url { color: #94a3b8; font-size: 11px; margin-top: 2px; line-height: 1.2; }
.text-truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.t-val { font-weight: bold; color: #1e293b; display: flex; align-items: center; gap: 4px; flex: 0 0 auto; }
.t-count-num { min-width: 18px; text-align: right; }
.t-count-label { color: #94a3b8; font-weight: 400; font-size: 11px; }
.t-grade { font-size: 11px; min-width: 18px; height: 18px; line-height: 18px; border-radius: 9px; text-align: center; background: #f1f5f9; display: inline-block; }
.g-S, .g-A { color: #f59e0b; }
.g-B { color: #10b981; }
.g-C { color: #94a3b8; }

/* 等级分布颜色 */
.grade-text-S { color: #ef4444; }
.grade-text-A { color: #f59e0b; }
.grade-text-B { color: #10b981; }
.grade-text-C { color: #64748b; }
</style>