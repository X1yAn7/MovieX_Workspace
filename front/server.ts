import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Mock API for Movie Data
  app.get("/api/dashboard-data", (req, res) => {
    res.json({
      heroMovie: {
        title: "奥本海默",
        originalTitle: "Oppenheimer",
        year: 2023,
        director: "克里斯托弗·诺兰",
        writers: "克里斯托弗·诺兰 / 凯·伯德 / 马丁·J·舍温",
        genres: "传记 / 剧情 / 历史",
        duration: "180 分钟",
        releaseDate: "2023-07-21 (美国)",
        regions: "美国 / 英国",
        imdbRating: 8.3,
        imdbVotes: "823K",
        movieLensScore: 87,
        recommendationRate: "95%",
        poster: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=400&h=600&fit=crop"
      },
      keywords: [
        { name: "核武器", weight: 10, color: "text-blue-600" },
        { name: "原子弹", weight: 8, color: "text-orange-500" },
        { name: "科学家", weight: 9, color: "text-emerald-600" },
        { name: "二战", weight: 7, color: "text-blue-500" },
        { name: "政治", weight: 6, color: "text-blue-400" },
        { name: "研发", weight: 6, color: "text-cyan-500" },
        // ... more keywords
      ],
      productionTrends: [
        { year: 2010, count: 6500, growth: 2 },
        { year: 2011, count: 7200, growth: 5 },
        { year: 2012, count: 6800, growth: -4 },
        { year: 2013, count: 7500, growth: 10 },
        { year: 2014, count: 8200, growth: 8 },
        { year: 2015, count: 8500, growth: 3 },
        { year: 2016, count: 9100, growth: 7 },
        { year: 2017, count: 8800, growth: -3 },
        { year: 2018, count: 9500, growth: 8 },
        { year: 2019, count: 10200, growth: 7 },
        { year: 2020, count: 4500, growth: -55 },
        { year: 2021, count: 6800, growth: 51 },
        { year: 2022, count: 8500, growth: 25 },
        { year: 2023, count: 9800, growth: 15 },
        { year: 2024, count: 10500, growth: 7 },
      ],
      financials: {
        globalBoxOffice: "$952.15M",
        naBoxOffice: "$324.36M",
        chinaBoxOffice: "$113.15M",
        otherBoxOffice: "$514.64M",
        cost: "$100.00M",
        roi: "9.52x",
        trajectory: [
          { day: 0, na: 0, global: 0, china: 0 },
          { day: 10, na: 100, global: 250, china: 50 },
          { day: 20, na: 180, global: 450, china: 80 },
          { day: 30, na: 230, global: 600, china: 95 },
          { day: 40, na: 260, global: 700, china: 105 },
          { day: 50, na: 280, global: 780, china: 110 },
          { day: 60, na: 300, global: 850, china: 112 },
          { day: 70, na: 310, global: 900, china: 113 },
          { day: 80, na: 320, global: 930, china: 113 },
          { day: 90, na: 324, global: 952, china: 113 },
        ]
      },
      genreDistribution: [
        { name: '科幻', value: 35 },
        { name: '剧情', value: 25 },
        { name: '动作', value: 20 },
        { name: '动画', value: 10 },
        { name: '其他', value: 10 },
      ],
      knowledgeGraph: {
        nodes: [
          { id: '1', label: '奥本海默', type: 'movie' },
          { id: '2', label: '克里斯托弗·诺兰', type: 'director' },
          { id: '3', label: '基里安·墨菲', type: 'actor' },
          { id: '4', label: '艾米莉·布朗特', type: 'actor' },
          { id: '5', label: '环球影业', type: 'studio' },
          { id: '6', label: '科幻', type: 'genre' },
          { id: '7', label: '星际穿越', type: 'movie' },
        ],
        links: [
          { source: '1', target: '2', label: '导演' },
          { source: '1', target: '3', label: '主演' },
          { source: '1', target: '4', label: '主演' },
          { source: '1', target: '5', label: '发行' },
          { source: '1', target: '6', label: '题材' },
          { source: '7', target: '2', label: '导演' },
        ]
      },
      analysis: {
        demographics: [
          { group: '18-24岁', value: 25 },
          { group: '25-34岁', value: 35 },
          { group: '35-44岁', value: 20 },
          { group: '45-54岁', value: 12 },
          { group: '55岁以上', value: 8 },
        ],
        marketPenetration: [
          { region: '北美', reach: 85, potential: 95 },
          { region: '东亚', reach: 72, potential: 90 },
          { region: '欧洲', reach: 68, potential: 85 },
          { region: '南美', reach: 45, potential: 75 },
          { region: '其他地区', reach: 30, potential: 60 },
        ],
        sentimentCorrelation: [
          { metric: '视觉效果', audience: 92, critics: 95 },
          { metric: '节奏控制', audience: 75, critics: 82 },
          { metric: '演员性能', audience: 88, critics: 94 },
          { metric: '电影配乐', audience: 95, critics: 96 },
          { metric: '叙事结构', audience: 78, critics: 88 },
        ]
      },
      reviews: [
        {
          id: '1',
          userName: '伊丽莎白·斯旺 博士',
          userAvatar: 'https://i.pravatar.cc/150?u=swan',
          rating: 4.5,
          sentiment: 'Analytical',
          content: '叙事结构巧妙地映射了记忆和良知的碎片化本质。这是导演精准掌握的大师级研究。',
          date: '2小时前'
        },
        {
          id: '2',
          userName: '马可·奥勒留',
          userAvatar: 'https://i.pravatar.cc/150?u=marcus',
          rating: 5.0,
          sentiment: 'Positive',
          content: '视觉上令人震撼，情感上沉重有力。这就是我们走进电影院的原因。诺兰的绝对巅峰之作。',
          date: '5小时前'
        },
        {
          id: '3',
          userName: '莎拉·詹金斯',
          userAvatar: 'https://i.pravatar.cc/150?u=sarah',
          rating: 3.5,
          sentiment: 'Neutral',
          content: '对我来说时间有点长，但表演是顶级的。第三幕如果能精简一点会更好。',
          date: '1天前'
        }
      ],
      discoveryMovies: [
        {
          title: '星际穿越',
          year: 2014,
          genres: '科幻 / 剧情',
          imdbRating: 8.7,
          poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=600&fit=crop',
          badge: '独播',
          stats: '852.1万追番'
        },
        {
          title: '蝙蝠侠：黑暗骑士',
          year: 2008,
          genres: '动作 / 犯罪',
          imdbRating: 9.0,
          poster: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400&h=600&fit=crop',
          badge: '会员',
          stats: '724.5万追番'
        },
        {
          title: '盗梦空间',
          year: 2010,
          genres: '动作 / 科幻',
          imdbRating: 8.8,
          poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop',
          badge: '独播',
          stats: '689.2万追番'
        },
        {
          title: '敦刻尔克',
          year: 2017,
          genres: '动作 / 剧情',
          imdbRating: 7.8,
          poster: 'https://images.unsplash.com/photo-1485038463604-28a95632d4b6?w=400&h=600&fit=crop',
          stats: '452.8万追番'
        },
        {
          title: '奥本海默',
          year: 2023,
          genres: '传记 / 剧情',
          imdbRating: 8.3,
          poster: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=400&h=600&fit=crop',
          badge: '新片',
          stats: '325.4万追番'
        },
        {
          title: '信条',
          year: 2020,
          genres: '动作 / 科幻',
          imdbRating: 7.3,
          poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop',
          stats: '214.7万追番'
        }
      ]
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
