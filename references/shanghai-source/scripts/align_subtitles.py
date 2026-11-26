# -*- coding: utf-8 -*-
"""
Precision 44-Beat Audio-Aligned Timeline for Shanghai 3D History Documentary (232.28s)
Every beat is aligned to exact waveform silence intervals in assets/audio/gemini_shanghai_narration.wav.
Coordinates are 100% calibrated to the real OSM/CMAB metric space:
- Old Walled City & Yu Garden: (-1320, 900)
- Shiliupu Wharf: (-720, 860)
- The Bund: x ~ -1200, z ~ -675 (Waibaidu) to +300
- Peace Hotel: (-1258.3, -291.6), Customs House: (-1197.1, -70.1), HSBC: (-1190, -15)
- Shikumen / First CPC Congress: (-1620, 320)
- Oriental Pearl: (-260.3, -433.8), Jin Mao: (323.0, 82.0), SWFC: (475.3, 156.8), Shanghai Tower: (311.1, 268.0)
"""
import json
import os

SUBTITLE_TIMELINE = [
    # ==================== PROLOGUE (0.00s - 39.68s) ====================
    {
        "id": 1, "start": 0.00, "end": 3.77,
        "chapter": "序章 · 沧海桑田 申城溯源", "chapter_en": "Prologue: Ancient Waters & Origins",
        "cn": "序章：沧海桑田，申城溯源。",
        "en": "Prologue: Ancient Waters and the Origins of Shanghai.",
        "highlight_cn": "沧海桑田，申城溯源",
        "era_max_year": -4000,
        "shot_id": "cosmic_globe_zoom",
        "art_img": "earth_eastern.jpg",
        "art_badge": "寰宇视角 · 东经121°北纬31°",
        "art_title": "从蔚蓝星球俯瞰东海之滨",
        "art_desc": "自太空深处推拉聚焦亚欧大陆东缘，锁定北纬31°14'、东经121°29'江海交汇之地。",
        "callout": {"pos": [-850, 30, 0], "title": "上海地理坐标 · 31°14'N 121°29'E", "sub": "太平洋西岸 · 长江入海口冲积平原"}
    },
    {
        "id": 2, "start": 3.77, "end": 6.39,
        "chapter": "序章 · 沧海桑田 申城溯源", "chapter_en": "Prologue: Ancient Waters & Origins",
        "cn": "大江东去，入海为潮。",
        "en": "Where the mighty Yangtze rushes east to meet the ocean tides.",
        "highlight_cn": "大江东去，入海为潮",
        "era_max_year": -4000,
        "shot_id": "china_to_yangtze_estuary",
        "art_img": "ma_yuan_water.jpg",
        "art_badge": "南宋国宝 · 马远《水图》",
        "art_title": "长江万顷 · 奔流入海",
        "art_desc": "万里长江裹挟浩瀚水脉自西向东奔涌入东海，江海激荡铸就壮阔潮汐。",
        "callout": {"pos": [-880, 20, -350], "title": "万里长江入海口 · 江海潮汐带", "sub": "年均径流量 9600亿立方米 · 东海交汇"}
    },
    {
        "id": 3, "start": 6.39, "end": 11.52,
        "chapter": "序章 · 沧海桑田 申城溯源", "chapter_en": "Prologue: Ancient Waters & Origins",
        "cn": "六千年前，长江泥沙在东海之滨逐渐堆积出一片沃土。",
        "en": "Six thousand years ago, river alluvium sculpted fertile land along the East China Sea.",
        "highlight_cn": "六千年前，长江泥沙",
        "era_max_year": -2000,
        "shot_id": "coastline_6000yr_morph",
        "art_img": "scroll_coastline_6000yr.jpg",
        "art_badge": "地质演进 · 冈身成陆",
        "art_title": "六千年古海岸线东移图谱",
        "art_desc": "从马桥、漕泾贝壳沙带（古冈身）起步，长江泥沙年复一年向东海推进成陆。",
        "callout": {"pos": [-1350, 15, 600], "title": "古冈身海岸线遗址 · 公元前4000年", "sub": "马桥文化层 · 长江三角洲前缘冲积沃土"}
    },
    {
        "id": 4, "start": 11.52, "end": 15.31,
        "chapter": "序章 · 沧海桑田 申城溯源", "chapter_en": "Prologue: Ancient Waters & Origins",
        "cn": "战国楚国春申君黄歇在此疏浚江河，",
        "en": "In the Warring States period, Lord Chunshen of Chu dredged the choked rivers here,",
        "highlight_cn": "春申君黄歇在此疏浚江河",
        "era_max_year": -248,
        "shot_id": "chunshen_dredging_water",
        "art_img": "scroll_chunshen_river.jpg",
        "art_badge": "战国纪事 · 公元前248年",
        "art_title": "春申君黄歇治水开浦",
        "art_desc": "战国四公子之一春申君黄歇封于江东吴地，率民疏治松江水患，导水入海。",
        "callout": {"pos": [-880, 15, 250], "title": "春申君开浚古水道 · 前248年", "sub": "战国楚相黄歇封地 · 江南治水壮举"}
    },
    {
        "id": 5, "start": 15.31, "end": 22.01,
        "chapter": "序章 · 沧海桑田 申城溯源", "chapter_en": "Prologue: Ancient Waters & Origins",
        "cn": "后人念其恩德，将母亲河命名为黄浦江，上海亦因此别称“申”。",
        "en": "Immortalizing his legacy, the mother river was named Huangpu, and Shanghai became 'Shen'.",
        "highlight_cn": "命名为黄浦江，上海亦因此别称“申”",
        "era_max_year": 0,
        "shot_id": "huangpu_shen_origin",
        "art_img": "scroll_chunshen_river.jpg",
        "art_badge": "申城溯源 · 母亲河得名",
        "art_title": "黄歇浦与「申城」金印",
        "art_desc": "黄浦江又称黄歇浦、春申江，穿城而过的S形大江成为上海生生不息的母亲河。",
        "callout": {"pos": [-850, 18, -100], "title": "母亲河 · 黄浦江 (春申江)", "sub": "全长113.4公里 · 上海别称「申」之源"}
    },
    {
        "id": 6, "start": 22.01, "end": 26.83,
        "chapter": "序章 · 沧海桑田 申城溯源", "chapter_en": "Prologue: Ancient Waters & Origins",
        "cn": "晋代渔民以竹制“扈”插江捕鱼，后改称“沪”。",
        "en": "Jin Dynasty fishermen staked bamboo 'Hu' traps in the tides, birthing the name 'Hu'.",
        "highlight_cn": "竹制“扈”插江捕鱼，后改称“沪”",
        "era_max_year": 400,
        "shot_id": "wusong_bamboo_hu",
        "art_img": "scroll_bamboo_hu.jpg",
        "art_badge": "字源考古 · 晋唐沪渎",
        "art_title": "列竹于海澨曰「沪」",
        "art_desc": "古吴淞江入海处称沪渎，渔民顺应潮汐插竹编「扈」捕鱼，演化为上海简称「沪」。",
        "callout": {"pos": [-1150, 15, -675], "title": "古吴淞江 (苏州河) 入江口 · 沪渎", "sub": "晋代竹扈捕鱼 · 上海简称「沪」发源地"}
    },
    {
        "id": 7, "start": 26.83, "end": 32.74,
        "chapter": "序章 · 沧海桑田 申城溯源", "chapter_en": "Prologue: Ancient Waters & Origins",
        "cn": "从唐宋渔盐小镇，到公元1292年元代正式设立上海县，",
        "en": "Growing from a Tang-Song salt port to the founding of Shanghai County in 1292,",
        "highlight_cn": "公元1292年元代正式设立上海县",
        "era_max_year": 1350,
        "shot_id": "yuan_1292_county_founding",
        "art_img": "scroll_yuan_1292.jpg",
        "art_badge": "建县大典 · 至元二十九年",
        "art_title": "1292年元代正式设立上海县",
        "art_desc": "北宋1077年设上海务，南宋1267年建上海镇，元至元二十九年（1292）正式立县。",
        "callout": {"pos": [-1320, 22, 920], "title": "元代上海县署旧址 · 公元1292年", "sub": "辖华亭东北五乡 · 开启七百余年建城史"}
    },
    {
        "id": 8, "start": 32.74, "end": 39.68,
        "chapter": "序章 · 沧海桑田 申城溯源", "chapter_en": "Prologue: Ancient Waters & Origins",
        "cn": "一座因水而生、因港而兴的东方大邑，在海天之间破浪萌芽。",
        "en": "A grand Oriental metropolis born of water and harbors sprouted between sea and sky.",
        "highlight_cn": "因水而生、因港而兴的东方大邑",
        "era_max_year": 1400,
        "shot_id": "ancient_harbor_rise",
        "art_img": "ma_yuan_sea.jpg",
        "art_badge": "海天气象 · 东方大邑",
        "art_title": "马远《水图·云生沧海》",
        "art_desc": "通江达海的绝佳水文区位，令这座江南县城迅速跃升为东亚航运网络的重要节点。",
        "callout": {"pos": [-1150, 20, 860], "title": "宋元上海浦古港区", "sub": "市舶提举司驻地 · 江海通航枢纽"}
    },

    # ==================== CHAPTER 1 (39.68s - 77.35s) ====================
    {
        "id": 9, "start": 39.68, "end": 43.27,
        "chapter": "第一章 · 明清繁会 老城豫园", "chapter_en": "Chapter 1: Ming & Qing Heritage",
        "cn": "第一章：明清繁会，老城豫园。",
        "en": "Chapter 1: Ming & Qing Prosperity — The Old Walled City and Yu Garden.",
        "highlight_cn": "明清繁会，老城豫园",
        "era_max_year": 1559,
        "shot_id": "ch1_intro_oldcity_map",
        "art_img": "map_1884_oldcity.jpg",
        "art_badge": "第一章 · 历史舆图叠影",
        "art_title": "明清上海老城厢环形舆图",
        "art_desc": "古舆图与CMAB三维空间精准叠合，唤醒明清老城厢的街巷肌理与古典飞檐。",
        "callout": {"pos": [-1320, 25, 920], "title": "明清上海老城厢核心区", "sub": "CMAB 历史风貌保护区 · 698栋 Pre-1843 古建群"}
    },
    {
        "id": 10, "start": 43.27, "end": 47.28,
        "chapter": "第一章 · 明清繁会 老城豫园", "chapter_en": "Chapter 1: Ming & Qing Heritage",
        "cn": "明清以降，江海交汇，百舸争流。",
        "en": "Through the Ming and Qing dynasties, rivers and seas converged with bustling fleets.",
        "highlight_cn": "江海交汇，百舸争流",
        "era_max_year": 1620,
        "shot_id": "ming_qing_water_routes",
        "art_img": "map_1854_muddy_flat.jpg",
        "art_badge": "明清水道 · 黄浦夺淞",
        "art_title": "1854年黄浦江与老城厢古海图",
        "art_desc": "明永乐年间叶宗行开浚范家浜，实现“黄浦夺淞”，浩瀚江水直抵县城东门之外。",
        "callout": {"pos": [-750, 15, 780], "title": "明永乐「黄浦夺淞」主航道", "sub": "水深江阔 · 奠定近代亿吨大港水文格局"}
    },
    {
        "id": 11, "start": 47.28, "end": 55.73,
        "chapter": "第一章 · 明清繁会 老城豫园", "chapter_en": "Chapter 1: Ming & Qing Heritage",
        "cn": "明嘉靖年间，为御外患保境安民，上海筑起雄伟城垣，奠定了老城厢的历史肌理。",
        "en": "In 1553, a five-kilometer circular city wall rose to guard the coast, shaping the Old City.",
        "highlight_cn": "筑起雄伟城垣，奠定了老城厢的历史肌理",
        "era_max_year": 1700,
        "shot_id": "ming_city_wall_growth",
        "art_img": "map_1884_oldcity.jpg",
        "art_badge": "明嘉靖三十二年 · 1553年",
        "art_title": "九里环形城垣与六座水陆城门",
        "art_desc": "仅用三月筑成周长九里、高二丈四尺的环形城墙，辟朝宗门（大东门）等六座城门。",
        "callout": {"pos": [-1320, 30, 950], "title": "明嘉靖上海县环形城垣 · 1553年", "sub": "周长九里 (约5公里) · 奠定人民路/中华路环线"}
    },
    {
        "id": 12, "start": 55.73, "end": 61.19,
        "chapter": "第一章 · 明清繁会 老城豫园", "chapter_en": "Chapter 1: Ming & Qing Heritage",
        "cn": "潘允端历时二十余载精筑豫园，九曲回廊，雕梁画栋，",
        "en": "Pan Yunduan spent twenty years crafting Yu Garden with winding corridors and carved beams,",
        "highlight_cn": "精筑豫园，九曲回廊，雕梁画栋",
        "era_max_year": 1760,
        "shot_id": "yuyuan_zigzag_closeup",
        "art_img": "zigzag_bridge_vintage.jpg",
        "art_badge": "明代名园 · 1559年肇建",
        "art_title": "豫园九曲桥百年历史影像",
        "art_desc": "明刑部尚书潘允端为“愉悦老亲”历时二十余年筑豫园，步移景异，巧夺天工。",
        "callout": {"pos": [-1266, 22, 851], "title": "豫园古建筑群 · CMAB_SH_000628", "sub": "始建1559年 | 结构: Timber-Earth | 高度: 18.0m"}
    },
    {
        "id": 13, "start": 61.19, "end": 67.16,
        "chapter": "第一章 · 明清繁会 老城豫园", "chapter_en": "Chapter 1: Ming & Qing Heritage",
        "cn": "水榭飞檐掩映在翠竹花木之间，开创江南园林之典范。",
        "en": "Waterside pavilions and upturned eaves nestled in bamboo, a pinnacle of Jiangnan gardens.",
        "highlight_cn": "水榭飞檐掩映在翠竹花木之间",
        "era_max_year": 1800,
        "shot_id": "huxinting_pavilion_orbit",
        "art_img": "huxinting_vintage.jpg",
        "art_badge": "江南古典美学 · 湖心亭",
        "art_title": "晚清老城厢湖心亭典藏留影",
        "art_desc": "荷花池畔飞檐翘角凌空欲飞，倒映碧水之间，尽显江南古典造园艺术之极致。",
        "callout": {"pos": [-1173, 20, 864], "title": "豫园湖心亭与荷花池", "sub": "清乾隆四十九年 (1784) · 江南水榭木构典范"}
    },
    {
        "id": 14, "start": 67.16, "end": 71.22,
        "chapter": "第一章 · 明清繁会 老城豫园", "chapter_en": "Chapter 1: Ming & Qing Heritage",
        "cn": "十六铺码头沙船云集，帆樯如林，",
        "en": "At Shiliupu Wharf, flat-bottomed sand junks gathered like a forest of masts,",
        "highlight_cn": "十六铺码头沙船云集，帆樯如林",
        "era_max_year": 1830,
        "shot_id": "shiliupu_wharf_junks",
        "art_img": "map_1884_full.jpg",
        "art_badge": "漕运枢纽 · 十六铺千帆",
        "art_title": "清代十六铺沙船航运盛景",
        "art_desc": "大东门外十六铺岸线，超过三千五百艘平底沙船往来南北洋，桅杆如林遮蔽江面。",
        "callout": {"pos": [-720, 18, 860], "title": "十六铺古码头群 · 南北漕运起点", "sub": "停泊沙船逾3500艘 · 年吞吐棉布粮米冠绝江南"}
    },
    {
        "id": 15, "start": 71.22, "end": 77.35,
        "chapter": "第一章 · 明清繁会 老城豫园", "chapter_en": "Chapter 1: Ming & Qing Heritage",
        "cn": "“江海通津，东南都会”的繁华盛景，自此流淌于城市血脉。",
        "en": "Forging Shanghai's lifeblood as the 'Grand Gateway of River and Sea, Metropolis of the Southeast'.",
        "highlight_cn": "“江海通津，东南都会”",
        "era_max_year": 1842,
        "shot_id": "southeast_metropolis_vista",
        "art_img": "map_1884_full.jpg",
        "art_badge": "嘉庆题誉 · 东南都会",
        "art_title": "1884年上海城厢与江岸全图",
        "art_desc": "早在开埠之前，上海已凭沙船贸易与棉纺织业跃居“江海之通津，东南之都会”。",
        "callout": {"pos": [-980, 26, 820], "title": "清代江海大关与商贸街区", "sub": "康熙二十四年 (1685) 设江海关 · 对外贸易门户"}
    },

    # ==================== CHAPTER 2 (77.35s - 114.65s) ====================
    {
        "id": 16, "start": 77.35, "end": 80.86,
        "chapter": "第二章 · 西风东渐 万国风云", "chapter_en": "Chapter 2: East Meets West & The Bund",
        "cn": "第二章：西风东渐，万国风云。",
        "en": "Chapter 2: East Meets West — The Bund and International Winds.",
        "highlight_cn": "西风东渐，万国风云",
        "era_max_year": 1890,
        "shot_id": "ch2_intro_bund_compass",
        "art_img": "vintage_bund_map_1932.jpg",
        "art_badge": "第二章 · 近代开埠风云",
        "art_title": "1932年上海外滩与租界历史测绘图",
        "art_desc": "镜头自老城厢沿黄浦江西岸向北推进，见证纤夫小道向远东金融街的世纪蜕变。",
        "callout": {"pos": [-1190, 35, -150], "title": "黄浦江西岸 · 外滩历史风貌区", "sub": "全长1.5公里 · 477栋 1843–1949 近代历史建筑"}
    },
    {
        "id": 17, "start": 80.86, "end": 85.78,
        "chapter": "第二章 · 西风东渐 万国风云", "chapter_en": "Chapter 2: East Meets West & The Bund",
        "cn": "1843年上海正式开埠，世界风潮滚滚而来。",
        "en": "With the opening of the port in 1843, global currents surged onto Shanghai's shores.",
        "highlight_cn": "1843年上海正式开埠",
        "era_max_year": 1910,
        "shot_id": "waibaidu_bridge_1843",
        "art_img": "waibaidu_vintage.jpg",
        "art_badge": "百年钢桥 · 苏州河口",
        "art_title": "外白渡桥与外滩公园历史影像",
        "art_desc": "1843年11月17日上海正式开埠，苏州河与黄浦江交汇处的外白渡桥见证百年沧桑。",
        "callout": {"pos": [-1075, 22, -675], "title": "外白渡桥 (Garden Bridge) · 1907年", "sub": "中国第一座全钢结构铆接桥梁 · 苏州河入江口"}
    },
    {
        "id": 18, "start": 85.78, "end": 91.03,
        "chapter": "第二章 · 西风东渐 万国风云", "chapter_en": "Chapter 2: East Meets West & The Bund",
        "cn": "黄浦江畔筑起举世闻名的外滩万国建筑博览群。",
        "en": "Along the west bank of the Huangpu rose the world-famous Bund architectural gallery.",
        "highlight_cn": "外滩万国建筑博览群",
        "era_max_year": 1925,
        "shot_id": "bund_gallery_sweep",
        "art_img": "bund_1930.jpg",
        "art_badge": "远东华尔街 · 万国建筑群",
        "art_title": "1930年代外滩万国建筑群全景",
        "art_desc": "新古典主义、巴洛克、哥特复兴与装饰艺术派建筑沿江一字排开，气势恢宏。",
        "callout": {"pos": [-1210, 50, -180], "title": "外滩万国建筑博览群 (The Bund)", "sub": "CMAB 1843-1949 年代层 · Masonry-Stone 石材巨构"}
    },
    {
        "id": 19, "start": 91.03, "end": 93.75,
        "chapter": "第二章 · 西风东渐 万国风云", "chapter_en": "Chapter 2: East Meets West & The Bund",
        "cn": "海关大楼的钟声沉稳悠远，",
        "en": "The deep chimes of the Customs House echoed across the river,",
        "highlight_cn": "海关大楼的钟声沉稳悠远",
        "era_max_year": 1928,
        "shot_id": "customs_house_focus",
        "art_img": "customs_house_modern.jpg",
        "art_badge": "外滩13号 · 1927年落成",
        "art_title": "江海关大楼与亚洲第一大钟",
        "art_desc": "希腊多立克柱式门廊之上耸立79.2米钟楼，大钟直径5.4米，钟声激荡十里洋场。",
        "callout": {"pos": [-1197, 79, -70], "title": "江海关大楼 · CMAB_SH_000113", "sub": "1927年建 | 高度: 79.2m | 结构: 花岗岩钢骨砌体"}
    },
    {
        "id": 20, "start": 93.75, "end": 96.73,
        "chapter": "第二章 · 西风东渐 万国风云", "chapter_en": "Chapter 2: East Meets West & The Bund",
        "cn": "和平饭店的哥特式绿顶傲立江岸，",
        "en": "The Gothic green copper pyramid of the Peace Hotel stood proud by the water,",
        "highlight_cn": "和平饭店的哥特式绿顶傲立江岸",
        "era_max_year": 1932,
        "shot_id": "peace_hotel_focus",
        "art_img": "peace_hotel.jpg",
        "art_badge": "外滩20号 · 1929年沙逊大厦",
        "art_title": "和平饭店芝加哥学派哥特绿顶",
        "art_desc": "77米高的紫铜金字塔墨绿屋顶直插云霄，曾被誉为“远东第一楼”，尽显Art Deco风华。",
        "callout": {"pos": [-1258, 77, -292], "title": "和平饭店 (沙逊大厦) · CMAB_SH_000104", "sub": "1929年建 | 高度: 77.0m | 标志性19米墨绿铜顶"}
    },
    {
        "id": 21, "start": 96.73, "end": 100.54,
        "chapter": "第二章 · 西风东渐 万国风云", "chapter_en": "Chapter 2: East Meets West & The Bund",
        "cn": "汇丰大厦的花岗岩穹顶威严庄重。",
        "en": "And the neoclassical granite dome of the HSBC Building radiated solemn grandeur.",
        "highlight_cn": "汇丰大厦的花岗岩穹顶威严庄重",
        "era_max_year": 1936,
        "shot_id": "hsbc_dome_focus",
        "art_img": "hsbc_building.jpg",
        "art_badge": "外滩12号 · 1923年落成",
        "art_title": "原汇丰银行大楼新古典主义穹顶",
        "art_desc": "采用严谨的三段式新古典主义立面与巨型罗马石柱，穹顶壁画镶嵌数十万片威尼斯马赛克。",
        "callout": {"pos": [-1190, 48, -15], "title": "原汇丰银行大楼 · 外滩12号", "sub": "1923年建 | 高度: 45.0m | 新古典主义花岗岩穹顶"}
    },
    {
        "id": 22, "start": 100.54, "end": 106.71,
        "chapter": "第二章 · 西风东渐 万国风云", "chapter_en": "Chapter 2: East Meets West & The Bund",
        "cn": "而在纵横交错的里弄深处，红灰交织的石库门院落温暖延展，",
        "en": "Deep within crisscrossing lanes, red-and-grey Shikumen courtyards warmly unfolded,",
        "highlight_cn": "红灰交织的石库门院落温暖延展",
        "era_max_year": 1942,
        "shot_id": "shikumen_alleys_glide",
        "art_img": "shikumen_heritage.jpg",
        "art_badge": "中西合璧 · 里弄民居",
        "art_title": "石库门乌漆大门与巴洛克山花门头",
        "art_desc": "江南传统三合院天井与西方联排住宅巧妙交融，青砖红瓦间承载着数百万上海市民的烟火日常。",
        "callout": {"pos": [-1560, 24, 120], "title": "浦西石库门里弄建筑群", "sub": "中式天井 × 西式联排山花 · 上海近代居住肌理核心"}
    },
    {
        "id": 23, "start": 106.71, "end": 114.65,
        "chapter": "第二章 · 西风东渐 万国风云", "chapter_en": "Chapter 2: East Meets West & The Bund",
        "cn": "吴侬软语与留声机旋律交汇，孕育出中西合璧、开放包容的海派文化。",
        "en": "Where Wu dialect met gramophone melodies, birthing the eclectic and inclusive Haipai culture.",
        "highlight_cn": "中西合璧、开放包容的海派文化",
        "era_max_year": 1948,
        "shot_id": "haipai_nanjing_road",
        "art_img": "nanjing_rd_1930.jpg",
        "art_badge": "十里洋场 · 海派文化摇篮",
        "art_title": "1930年代南京路四大百货繁华街景",
        "art_desc": "有轨电车叮当穿行，霓虹招牌与摩登大楼林立，江南灵秀与世界文明在此碰撞交融。",
        "callout": {"pos": [-1480, 35, -280], "title": "南京路历史商业走廊", "sub": "中国现代商业、电影、出版与海派艺术策源地"}
    },

    # ==================== CHAPTER 3 (114.65s - 150.52s) ====================
    {
        "id": 24, "start": 114.65, "end": 118.40,
        "chapter": "第三章 · 红色觉醒 工业新生", "chapter_en": "Chapter 3: Red Dawn & Industrial Power",
        "cn": "第三章：红色觉醒，工业新生。",
        "en": "Chapter 3: Red Awakening and Industrial Rebirth.",
        "highlight_cn": "红色觉醒，工业新生",
        "era_max_year": 1949,
        "shot_id": "ch3_intro_red_spark",
        "art_img": "cpc_first_congress.jpg",
        "art_badge": "第三章 · 初心之地",
        "art_title": "从石库门星火到新中国工业脊梁",
        "art_desc": "暗夜之中赤金星火在浦西里弄点燃，照亮二十世纪中国的波澜壮阔征程。",
        "callout": {"pos": [-1620, 22, 320], "title": "红色基因与觉醒年代坐标", "sub": "上海 · 中国近现代工人运动与革命摇篮"}
    },
    {
        "id": 25, "start": 118.40, "end": 121.57,
        "chapter": "第三章 · 红色觉醒 工业新生", "chapter_en": "Chapter 3: Red Dawn & Industrial Power",
        "cn": "浪奔浪流，人间换了新天。",
        "en": "Through surging waves and currents, a brand new world dawned.",
        "highlight_cn": "浪奔浪流，人间换了新天",
        "era_max_year": 1949,
        "shot_id": "river_surging_dawn",
        "art_img": "customs_house_vintage.jpg",
        "art_badge": "时代洪流 · 沧桑巨变",
        "art_title": "黄浦江惊涛拍岸见证历史转折",
        "art_desc": "滚滚黄浦江水奔腾不息，冲破近代屈辱阴霾，迎来民族独立与人民解放的新纪元。",
        "callout": {"pos": [-920, 18, -120], "title": "黄浦江黄金水道 · 时代潮头", "sub": "见证1921觉醒至1949上海新生"}
    },
    {
        "id": 26, "start": 121.57, "end": 128.08,
        "chapter": "第三章 · 红色觉醒 工业新生", "chapter_en": "Chapter 3: Red Dawn & Industrial Power",
        "cn": "1921年夏，兴业路一栋普通的石库门民居里，",
        "en": "In the summer of 1921, inside a modest Shikumen house on Xingye Road,",
        "highlight_cn": "1921年夏，兴业路一栋普通的石库门民居",
        "era_max_year": 1949,
        "shot_id": "xingye_rd_1921_focus",
        "art_img": "cpc_first_congress.jpg",
        "art_badge": "1921年7月23日 · 兴业路76号",
        "art_title": "中共一大会址石库门外景",
        "art_desc": "原望志路106号（今兴业路76号）典型石库门里弄住宅，成为开天辟地的历史坐标。",
        "callout": {"pos": [-1620, 20, 320], "title": "中共一大会址 · 兴业路76号", "sub": "1920年建 | 砖木石库门结构 | 第一批全国重点文保"}
    },
    {
        "id": 27, "start": 128.08, "end": 133.72,
        "chapter": "第三章 · 红色觉醒 工业新生", "chapter_en": "Chapter 3: Red Dawn & Industrial Power",
        "cn": "中国共产党第一次全国代表大会秘密召开，点亮了中华民族救亡图存的红色曙光。",
        "en": "The First CPC National Congress convened in secret, igniting the red dawn of national awakening.",
        "highlight_cn": "点亮了中华民族救亡图存的红色曙光",
        "era_max_year": 1949,
        "shot_id": "red_pulse_across_city",
        "art_img": "cpc_first_congress.jpg",
        "art_badge": "星火燎原 · 红色记忆",
        "art_title": "从石库门到天安门的精神航标",
        "art_desc": "赤金光波自兴业路向全城辐射，串联起一大、二大、四大及龙华等百余处红色遗迹。",
        "callout": {"pos": [-1550, 28, 220], "title": "上海红色历史建筑遗产网", "sub": "全市保存革命旧址遗迹 600余处"}
    },
    {
        "id": 28, "start": 133.72, "end": 141.78,
        "chapter": "第三章 · 红色觉醒 工业新生", "chapter_en": "Chapter 3: Red Dawn & Industrial Power",
        "cn": "新中国成立后，上海迅速成长为全国最大的现代工业重镇。",
        "en": "After 1949, Shanghai rapidly grew into the nation's largest modern industrial powerhouse.",
        "highlight_cn": "全国最大的现代工业重镇",
        "era_max_year": 1978,
        "shot_id": "industrial_1949_boom",
        "art_img": "scroll_made_in_shanghai.jpg",
        "art_badge": "1949–1978 · 工业版图跃升",
        "art_title": "CMAB 新中国建设期建筑群大规模生长",
        "art_desc": "三维沙盘上代表1949–1989年代的477栋现代厂房、科研院所与工人新村全面点亮。",
        "callout": {"pos": [-1520, 35, -520], "title": "CMAB 1949–1978 现代建设层", "sub": "新增钢混结构建筑群 · 奠定完备现代工业体系"}
    },
    {
        "id": 29, "start": 141.78, "end": 145.93,
        "chapter": "第三章 · 红色觉醒 工业新生", "chapter_en": "Chapter 3: Red Dawn & Industrial Power",
        "cn": "万吨巨轮扬帆远航，轻工纺织畅销大江南北，",
        "en": "Ten-thousand-ton vessels set sail, while light textiles reached every corner of the land,",
        "highlight_cn": "万吨巨轮扬帆远航，轻工纺织畅销大江南北",
        "era_max_year": 1985,
        "shot_id": "jiangnan_shipyard_sail",
        "art_img": "jiangnan_shipyard.jpg",
        "art_badge": "国之重器 · 江南造船",
        "art_title": "从1865江南制造局到现代巨轮摇篮",
        "art_desc": "第一艘万吨远洋货轮“东风号”、第一台万吨水压机在此诞生，挺起中国民族工业脊梁。",
        "callout": {"pos": [-950, 26, 480], "title": "黄浦江工业制造与航运走廊", "sub": "江南造船 · 沪东重机 · 杨浦百年工业岸线"}
    },
    {
        "id": 30, "start": 145.93, "end": 150.52,
        "chapter": "第三章 · 红色觉醒 工业新生", "chapter_en": "Chapter 3: Red Dawn & Industrial Power",
        "cn": "“上海制造”成为自力更生与卓越品质的金色丰碑。",
        "en": "Making 'Made in Shanghai' a golden monument of self-reliance and supreme craftsmanship.",
        "highlight_cn": "“上海制造”成为自力更生与卓越品质的金色丰碑",
        "era_max_year": 1989,
        "shot_id": "made_in_shanghai_glory",
        "art_img": "scroll_made_in_shanghai.jpg",
        "art_badge": "国民记忆 · 卓越匠心",
        "art_title": "享誉华夏的「上海制造」金字招牌",
        "art_desc": "上海牌手表、永久牌自行车、蝴蝶牌缝纫机与尖端科学仪器，镌刻几代中国人的共同记忆。",
        "callout": {"pos": [-1350, 40, -180], "title": "「上海制造」工业产值丰碑", "sub": "占全国工业总产值重要比重 · 匠心品质象征"}
    },

    # ==================== CHAPTER 4 (150.52s - 194.83s) ====================
    {
        "id": 31, "start": 150.52, "end": 154.28,
        "chapter": "第四章 · 世纪跃升 摩天崛起", "chapter_en": "Chapter 4: Pudong & Skyscraper Epoch",
        "cn": "第四章：世纪跃升，摩天崛起。",
        "en": "Chapter 4: Century Leap — Pudong Opening and Skyscraper Rise.",
        "highlight_cn": "世纪跃升，摩天崛起",
        "era_max_year": 1990,
        "shot_id": "ch4_laser_scan_pudong",
        "art_img": "scroll_cmab_blueprint.jpg",
        "art_badge": "第四章 · 跨江东进",
        "art_title": "从浦西外滩飞越黄浦江挺进浦东",
        "art_desc": "数字激光扫描线掠过黄浦江东岸，唤醒沉睡千年的浦东大地，开启世纪蝶变。",
        "callout": {"pos": [150, 30, 0], "title": "浦东陆家嘴金融贸易区核心", "sub": "与外滩隔江相望 · 1990年启动国家级开发开放"}
    },
    {
        "id": 32, "start": 154.28, "end": 159.98,
        "chapter": "第四章 · 世纪跃升 摩天崛起", "chapter_en": "Chapter 4: Pudong & Skyscraper Epoch",
        "cn": "1990年，党中央做出开发开放浦东的宏伟战略抉择。",
        "en": "In 1990, the historic strategic decision to develop and open Pudong was proclaimed.",
        "highlight_cn": "1990年，党中央做出开发开放浦东",
        "era_max_year": 1993,
        "shot_id": "pudong_1990_awakening",
        "art_img": "lujiazui_skyline.jpg",
        "art_badge": "1990年4月18日 · 历史抉择",
        "art_title": "浦东开发开放拉开跨世纪序幕",
        "art_desc": "昔日“宁要浦西一张床，不要浦东一间房”的芦苇荒滩，一跃成为中国改革开放的王牌旗帜。",
        "callout": {"pos": [220, 45, 50], "title": "1990 浦东开发开放先导区", "sub": "陆家嘴金融城 · 中国改革开放历史性坐标"}
    },
    {
        "id": 33, "start": 159.98, "end": 169.78,
        "chapter": "第四章 · 世纪跃升 摩天崛起", "chapter_en": "Chapter 4: Pudong & Skyscraper Epoch",
        "cn": "曾经的荒滩农田与烂泥渡路，在清华大学CMAB多属性三维数字孪生中实现震撼蝶变。",
        "en": "Former reed flats metamorphosed into a 3D digital twin powered by Tsinghua's CMAB dataset.",
        "highlight_cn": "清华大学CMAB多属性三维数字孪生",
        "era_max_year": 1996,
        "shot_id": "cmab_attribute_spectrum",
        "art_img": "scroll_cmab_blueprint.jpg",
        "art_badge": "清华大学 CMAB 权威数据",
        "art_title": "多属性三维建筑数字孪生解构",
        "art_desc": "融合高度(Height)、年代(Age)、功能(Function)、结构(Structure)四维属性，精准还原2657栋核心建筑。",
        "callout": {"pos": [180, 120, -80], "title": "清华大学 CMAB 三维城市底座", "sub": "2,657 栋单体 | 53 处水系面域 | 6大年代谱系"}
    },
    {
        "id": 34, "start": 169.78, "end": 173.38,
        "chapter": "第四章 · 世纪跃升 摩天崛起", "chapter_en": "Chapter 4: Pudong & Skyscraper Epoch",
        "cn": "东方明珠如璀璨巨珠落玉盘，",
        "en": "The Oriental Pearl Tower shines like luminous pearls dropping onto a jade plate,",
        "highlight_cn": "东方明珠如璀璨巨珠落玉盘",
        "era_max_year": 1998,
        "shot_id": "oriental_pearl_grow_focus",
        "art_img": "oriental_pearl.jpg",
        "art_badge": "1994年落成 · 468米地标",
        "art_title": "东方明珠广播电视塔 · 大珠小珠落玉盘",
        "art_desc": "11个大小不一的球体串联成白居易诗意画卷，三根直径9米擎天斜柱屹立浦江之畔。",
        "callout": {"pos": [-260, 350, -434], "title": "东方明珠广播电视塔 · CMAB_SH_000013", "sub": "1994年建 | 高度: 468.0m | 多筒球体巨型结构"}
    },
    {
        "id": 35, "start": 173.38, "end": 176.85,
        "chapter": "第四章 · 世纪跃升 摩天崛起", "chapter_en": "Chapter 4: Pudong & Skyscraper Epoch",
        "cn": "金茂大厦融汇唐宋古塔风韵，",
        "en": "Jin Mao Tower blends modernist steel with the rhythmic grace of Tang-Song pagodas,",
        "highlight_cn": "金茂大厦融汇唐宋古塔风韵",
        "era_max_year": 2004,
        "shot_id": "jin_mao_grow_focus",
        "art_img": "jin_mao_tower.jpg",
        "art_badge": "1999年落成 · 420.5米",
        "art_title": "金茂大厦 · 中华古塔神韵与现代钢构交响",
        "art_desc": "以88层阶梯式退台致敬唐宋宝塔比例，铝合金与玻璃幕墙折射出璀璨金辉。",
        "callout": {"pos": [323, 380, 82], "title": "金茂大厦 · CMAB_SH_000292", "sub": "1999年建 | 高度: 420.5m | 88层中式宝塔巨型框架"}
    },
    {
        "id": 36, "start": 176.85, "end": 180.19,
        "chapter": "第四章 · 世纪跃升 摩天崛起", "chapter_en": "Chapter 4: Pudong & Skyscraper Epoch",
        "cn": "环球金融中心气贯长虹，",
        "en": "The Shanghai World Financial Center pierces the sky with breathtaking precision,",
        "highlight_cn": "环球金融中心气贯长虹",
        "era_max_year": 2012,
        "shot_id": "swfc_grow_focus",
        "art_img": "swfc_tower.jpg",
        "art_badge": "2008年落成 · 492米",
        "art_title": "上海环球金融中心 · 天圆地方雕塑感极简之作",
        "art_desc": "方柱塔身向上切削收分，顶部50米跨度风洞开口有效降低风阻，尽显现代结构力学之美。",
        "callout": {"pos": [475, 440, 157], "title": "上海环球金融中心 · CMAB_SH_000003", "sub": "2008年建 | 高度: 492.0m | 地上101层巨型斜撑幕墙"}
    },
    {
        "id": 37, "start": 180.19, "end": 186.22,
        "chapter": "第四章 · 世纪跃升 摩天崛起", "chapter_en": "Chapter 4: Pudong & Skyscraper Epoch",
        "cn": "632米上海中心大厦如苍龙盘旋直入云端。",
        "en": "And the 632-meter Shanghai Tower spirals upward like a soaring dragon into the clouds.",
        "highlight_cn": "632米上海中心大厦如苍龙盘旋直入云端",
        "era_max_year": 2026,
        "shot_id": "shanghai_tower_spiral_grow",
        "art_img": "shanghai_tower.jpg",
        "art_badge": "2015年落成 · 中国第一高楼",
        "art_title": "上海中心大厦 · 632米双层玻璃幕墙螺旋升腾",
        "art_desc": "外幕墙随高度柔和扭转120度，削减24%高空风荷载，九个空中花园构筑垂直生态之城。",
        "callout": {"pos": [311, 560, 268], "title": "上海中心大厦 · CMAB_SH_000072", "sub": "2015年建 | 极值高度: 632.0m | 120°螺旋巨型结构"}
    },
    {
        "id": 38, "start": 186.22, "end": 194.83,
        "chapter": "第四章 · 世纪跃升 摩天崛起", "chapter_en": "Chapter 4: Pudong & Skyscraper Epoch",
        "cn": "错落有致的超高层天际线拔地而起，谱写出世界城市史上的东方奇迹。",
        "en": "A symphony of supertall skyscrapers rose from the earth, writing an Oriental miracle in urban history.",
        "highlight_cn": "超高层天际线拔地而起，谱写出世界城市史上的东方奇迹",
        "era_max_year": 2026,
        "shot_id": "lujiazui_miracle_orbit",
        "art_img": "lujiazui_skyline.jpg",
        "art_badge": "世界城市史奇迹 · 35年蝶变",
        "art_title": "陆家嘴超高层摩天建筑群全景天际线",
        "art_desc": "短短三十余载，逾千栋现代高楼在浦东拔地而起，铸就享誉全球的现代都市天际线。",
        "callout": {"pos": [350, 320, 120], "title": "陆家嘴超高层建筑群天际线", "sub": "1,005 栋浦东现代建筑 · 全球金融中心核心地标"}
    },

    # ==================== EPILOGUE (194.83s - 232.28s) ====================
    {
        "id": 39, "start": 194.83, "end": 198.72,
        "chapter": "尾声 · 海纳百川 卓越未来", "chapter_en": "Epilogue: Global Metropolis",
        "cn": "尾声：海纳百川，卓越未来。",
        "en": "Epilogue: Embracing A Hundred Rivers — Toward a Global Tomorrow.",
        "highlight_cn": "海纳百川，卓越未来",
        "era_max_year": 2026,
        "shot_id": "epilogue_golden_overview",
        "art_img": "bund_from_swfc_bluehour.jpg",
        "art_badge": "尾声 · 盛世华章",
        "art_title": "浦江两岸古今辉映的世界级大都市",
        "art_desc": "从七百年前的江南县城到卓越的全球城市，上海在数字孪生光影中绽放璀璨光芒。",
        "callout": {"pos": [-400, 120, 0], "title": "上海全域三维数字孪生全景", "sub": "浦西历史风貌 × 浦东现代摩天 · 交相辉映"}
    },
    {
        "id": 40, "start": 198.72, "end": 203.73,
        "chapter": "尾声 · 海纳百川 卓越未来", "chapter_en": "Epilogue: Global Metropolis",
        "cn": "海纳百川，追求卓越，开明睿智，大气谦和。",
        "en": "Inclusive, pursuing excellence, open-minded and wise, grand and humble.",
        "highlight_cn": "海纳百川，追求卓越，开明睿智，大气谦和",
        "era_max_year": 2026,
        "shot_id": "city_spirit_motto_scroll",
        "art_img": "scroll_city_spirit.jpg",
        "art_badge": "城市之魂 · 十六字品格",
        "art_title": "上海城市精神金石篆刻长卷",
        "art_desc": "因江海交汇而胸怀宽广，因敢为人先而追求卓越，熔铸成这座东方大都市的精神丰碑。",
        "callout": {"pos": [-650, 80, -100], "title": "上海十六字城市精神", "sub": "海纳百川 · 追求卓越 · 开明睿智 · 大气谦和"}
    },
    {
        "id": 41, "start": 203.73, "end": 209.52,
        "chapter": "尾声 · 海纳百川 卓越未来", "chapter_en": "Epilogue: Global Metropolis",
        "cn": "如今，黄浦江与苏州河世界级滨水岸线全线贯通，",
        "en": "Today, the world-class waterfronts of the Huangpu River and Suzhou Creek are fully united,",
        "highlight_cn": "黄浦江与苏州河世界级滨水岸线全线贯通",
        "era_max_year": 2026,
        "shot_id": "two_rivers_waterfront_glow",
        "art_img": "bund_from_swfc_bluehour.jpg",
        "art_badge": "一江一河 · 还江于民",
        "art_title": "黄浦江45公里与苏州河42公里岸线贯通",
        "art_desc": "昔日封闭的生产性工业码头转型为生态人文会客厅，碧波流金串起全城璀璨地标。",
        "callout": {"pos": [-1050, 25, -620], "title": "「一江一河」世界级滨水区交汇点", "sub": "黄浦江45km + 苏州河42km 公共空间全线贯通"}
    },
    {
        "id": 42, "start": 209.52, "end": 216.42,
        "chapter": "尾声 · 海纳百川 卓越未来", "chapter_en": "Epilogue: Global Metropolis",
        "cn": "古老的豫园飞檐与超现代的陆家嘴金顶隔江相望，互道沧桑。",
        "en": "Where the ancient upturned eaves of Yu Garden gaze across the waves at Lujiazui's golden spires.",
        "highlight_cn": "古老的豫园飞檐与超现代的陆家嘴金顶隔江相望",
        "era_max_year": 2026,
        "shot_id": "yuyuan_to_lujiazui_dialogue",
        "art_img": "huxinting_vintage.jpg",
        "art_badge": "时空对话 · 460年跨度",
        "art_title": "1559年明代豫园飞檐对望632米上海中心",
        "art_desc": "越过四百六十余年岁月长河，江南园林的黛瓦飞檐与直入云霄的摩天金顶在此同框共鸣。",
        "callout": {"pos": [311, 450, 268], "title": "跨江古今对话 · 1559 豫园 ↔ 2015 上海中心", "sub": "跨越456年建筑史 · 东方传统美学与未来科技同框"}
    },
    {
        "id": 43, "start": 216.42, "end": 223.90,
        "chapter": "尾声 · 海纳百川 卓越未来", "chapter_en": "Epilogue: Global Metropolis",
        "cn": "这不仅是一座三维城市的空间重构，更是一曲生生不息的文明交响。",
        "en": "More than a 3D reconstruction of urban space, this is an ever-living symphony of civilization.",
        "highlight_cn": "一曲生生不息的文明交响",
        "era_max_year": 2026,
        "shot_id": "civilization_symphony_3d",
        "art_img": "scroll_cmab_blueprint.jpg",
        "art_badge": "数字人文 · 文明交响",
        "art_title": "清华大学 CMAB × ©OpenStreetMap 历史长卷",
        "art_desc": "每一栋建筑都是一枚凝固的音符，共同奏响从沧海桑田到全球之城的恢弘历史交响。",
        "callout": {"pos": [-200, 180, 100], "title": "CMAB 全生命周期三维历史长卷", "sub": "公元前4000年成陆 → 1292立县 → 1843开埠 → 2026全球之城"}
    },
    {
        "id": 44, "start": 223.90, "end": 232.28,
        "chapter": "尾声 · 海纳百川 卓越未来", "chapter_en": "Epilogue: Global Metropolis",
        "cn": "东方明珠，历久弥新；大美上海，正昂首奔向更加恢弘的全球未来。",
        "en": "The Pearl of the Orient shines ever brighter; magnificent Shanghai strides toward a boundless global future.",
        "highlight_cn": "东方明珠，历久弥新；大美上海",
        "era_max_year": 2026,
        "shot_id": "finale_pullback_to_earth",
        "art_img": "earth_eastern.jpg",
        "art_badge": "首尾呼应 · 星辰大海",
        "art_title": "闪耀在蓝色星球东方的璀璨明珠",
        "art_desc": "镜头自陆家嘴之巅冲破云霄，拉升回望长三角、中国与浩瀚地球，东方明珠熠熠生辉。",
        "callout": {"pos": [-300, 200, 0], "title": "中国 · 上海 (SHANGHAI, CHINA)", "sub": "卓越的全球城市 · 迈向恢弘未来"}
    }
]

def format_ass_time(sec):
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = int(sec % 60)
    cs = int(round((sec - int(sec)) * 100))
    if cs >= 100:
        cs = 99
    return f"{h:01d}:{m:02d}:{s:02d}.{cs:02d}"

def generate_subtitles():
    os.makedirs("data", exist_ok=True)
    os.makedirs("output", exist_ok=True)
    os.makedirs("web/data", exist_ok=True)

    for item in SUBTITLE_TIMELINE:
        hl = item.get("highlight_cn", "")
        assert hl in item["cn"], f"Highlight '{hl}' not in '{item['cn']}' (id={item['id']})"

    with open("data/subtitles.json", "w", encoding="utf-8") as f:
        json.dump(SUBTITLE_TIMELINE, f, ensure_ascii=False, indent=2)
    print(f"Saved data/subtitles.json ({len(SUBTITLE_TIMELINE)} precision beats, 100% highlight match verified)")

    with open("web/data/subtitles_data.js", "w", encoding="utf-8") as f:
        f.write("window.SUBTITLES_DATA = ")
        json.dump(SUBTITLE_TIMELINE, f, ensure_ascii=False, indent=2)
        f.write(";\n")
    print("Saved web/data/subtitles_data.js")

    ass_header = """[Script Info]
Title: Shanghai 3D History Documentary
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: SubCN,Microsoft YaHei,40,&H00FFFFFF,&H0000D7FF,&H000F172A,&HB0000000,-1,0,0,0,100,100,1,0,1,3,1.5,2,40,40,72,1
Style: SubEN,Arial,23,&H00D0E8FF,&H0000FFFF,&H000F172A,&H90000000,0,0,0,0,100,100,0.5,0,1,2,1,2,40,40,34,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ass_events = []
    for item in SUBTITLE_TIMELINE:
        st = format_ass_time(item["start"])
        et = format_ass_time(item["end"])
        cn_text = item["cn"]
        hl = item.get("highlight_cn", "")
        if hl and hl in cn_text:
            highlighted_cn = cn_text.replace(hl, r"{\c&H003CE8FF\b1}" + hl + r"{\rSubCN}")
        else:
            highlighted_cn = cn_text
        ass_events.append(f"Dialogue: 1,{st},{et},SubCN,,0,0,0,,{highlighted_cn}")
        ass_events.append(f"Dialogue: 0,{st},{et},SubEN,,0,0,0,,{item['en']}")

    with open("output/subtitles.ass", "w", encoding="utf-8") as f:
        f.write(ass_header + "\n".join(ass_events))
    print("Saved output/subtitles.ass")

if __name__ == "__main__":
    generate_subtitles()
