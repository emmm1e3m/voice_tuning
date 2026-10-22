// 原文章节索引与正文分离，阅读时只加载当前章节。
export interface ManualImage { src: string; caption: string }
export type ManualBlock = { kind: 'html'; html: string } | { kind: 'figures'; figures: ManualImage[] }
export interface ManualChapter { id: string; sourceId: string; title: string; headings: { id: string; title: string }[] }

export const MANUAL_CHAPTERS: readonly ManualChapter[] = [
  {
    "id": "introduction",
    "sourceId": "sec-0-MTF20E5A3B0E99FB3E5A5B3E680A7E58C96E7BB83E4B9A0E",
    "title": "MTF 声音女性化练习手册",
    "headings": []
  },
  {
    "id": "foreword",
    "sourceId": "sec-2-E58699E59CA8E5898DE99DA2",
    "title": "写在前面",
    "headings": [
      {
        "id": "sec-3-E4B8BAE4BB80E4B988E7BB83E4B9A0E5A3B0E99FB3E5A5B3",
        "title": "为什么练习声音女性化"
      },
      {
        "id": "sec-4-E981BFE5858DE7BB83E4B9A0E8AFAFE58CBA",
        "title": "避免练习误区"
      }
    ]
  },
  {
    "id": "foundations",
    "sourceId": "sec-5-E8838CE699AFE79FA5E8AF86",
    "title": "背景知识",
    "headings": [
      {
        "id": "sec-6-E4B880E38081E4BABAE5A3B0E79A84E7949FE79086E8A7A3",
        "title": "一、人声的生理解剖学知识"
      },
      {
        "id": "sec-16-E4BA8CE38081E8AFADE99FB3E5A3B0E5ADA6EFBC88Voice2",
        "title": "二、语音声学（Voice Acoustic）的概述"
      },
      {
        "id": "sec-21-E4B889E38081E4BB8EE7AEA1E5AD90E588B0E5A3B0E98193",
        "title": "三、从管子到声道——共振峰是怎么\"长\"出来的"
      }
    ]
  },
  {
    "id": "perception",
    "sourceId": "sec-29-E5A3B0E99FB3E79A84E680A7E588ABE6849FE79FA5",
    "title": "声音的性别感知",
    "headings": [
      {
        "id": "sec-30-E4B880E38081E58583E99FB3E79A84E585B1E68CAFE5B3B0",
        "title": "一、元音的共振峰特征"
      },
      {
        "id": "sec-31-E4BA8CE38081E699AEE9809AE8AF9DE58583E99FB3E585B1",
        "title": "二、普通话元音共振峰的性别差异——数据与解释"
      },
      {
        "id": "sec-35-E4B889E38081E680A7E588ABE6849FE79FA5E79A84E585B3",
        "title": "三、性别感知的关联因素"
      }
    ]
  },
  {
    "id": "training",
    "sourceId": "sec-41-E4BDBFE794A820praat20E8BE85E58AA9E5A3B0E99FB3E7B",
    "title": "使用 praat 辅助声音练习",
    "headings": [
      {
        "id": "sec-42-E4B880E38081E99288E5AFB9E68F90E9AB9820F0EFBC9A",
        "title": "一、针对提高 F0："
      },
      {
        "id": "sec-46-E4BA8CE38081E99288E5AFB9E68F90E9AB9820F2EFBC88E9",
        "title": "二、针对提高 F2（高喉位训练）："
      },
      {
        "id": "sec-52-E4B889E38081E99288E5AFB9E68F90E9AB9820F1EFBC9A",
        "title": "三、针对提高 F1："
      },
      {
        "id": "sec-56-E59B9BE38081E99288E5AFB9E585B6E4BB96E4BFAEE9A5B0",
        "title": "四、针对其他修饰性因素"
      }
    ]
  },
  {
    "id": "review",
    "sourceId": "sec-61-E7BBBCE59088E887AAE68891E8AF84E4BCB0EFBC9AE4BDA0",
    "title": "综合自我评估：你准备好了吗？",
    "headings": []
  },
  {
    "id": "references",
    "sourceId": "sec-62-E58F82E88083E69687E78CAEE6B3A8E9878AEFBC9A",
    "title": "参考文献注释：",
    "headings": []
  }
]

const chapterLoaders: Record<string, () => Promise<{ default: ManualBlock[] }>> = {
  'introduction': () => import('./manual/introduction'),
  'foreword': () => import('./manual/foreword'),
  'foundations': () => import('./manual/foundations'),
  'perception': () => import('./manual/perception'),
  'training': () => import('./manual/training'),
  'review': () => import('./manual/review'),
  'references': () => import('./manual/references')
}

export function loadManualChapter(id: string): Promise<ManualBlock[]> {
  return (chapterLoaders[id] ?? chapterLoaders.introduction)().then(module => module.default)
}
