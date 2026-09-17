/**
 * guideSimpleEn 채우기 (도슨트 구조 변경, LLM 번역).
 *
 * place_info.guideSimpleKo(119건, "이곳은 {설명}입니다. {상세}." 2문장)을
 * 영문으로 옮겨 guideSimpleEn에 저장한다. guideDetailEn(=구 guideEn) ·
 * guideTipsRawEn과 함께 도슨트 3종(간단히/자세히/팁)을 영문으로 완성한다.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/fill-guide-simple-en.ts
 */

import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

const GUIDE_SIMPLE_EN: Record<string, string> = {
  plc_022169e454dd5c9ba5fad5c1c5de4b50:
    "This is a city staircase holding memories of the wartime refugee era. Around the 40 Stairs Memorial, you can encounter the stories of Korean War refugees who waited for family and made a living here, told through sculptures and information boards.",
  plc_03de50b9eb255edbad96975ab563f81e:
    "This is a family recreation park where you can walk through the forest and reservoir. Seongjigok Reservoir, its lush forest trails, and children's activity spaces come together to make it a good place for generations to relax together.",
  plc_08ce0955a14257eb9b3f2963d30cbd72:
    "This is a history museum where you can encounter Gaya tombs and excavated artifacts. Through relics unearthed at the Bokcheon-dong tomb cluster, you can understand Busan's Three Kingdoms period and Gaya culture.",
  plc_092ae16ed85d5c50a2500baa73b90b23:
    "This is a family museum where you learn science through hands-on exhibits. Many exhibits let you directly operate scientific principles in areas like automobiles, aerospace, and energy.",
  plc_0d048ddb22ff5e8f9e72ab2c80736ef9:
    "This is an alley where you encounter second-hand bookstores and old printing culture. Along the narrow alley, small bookshops packed with used books, old volumes, and vintage prints continue one after another.",
  plc_0f26be5211f2512990509cd4130c720c:
    "This is Sanbok Village, where the lives of refugees and traces of gravestones remain. Refugees settled here on top of a former cemetery, leaving behind traces of tombstones written into the retaining walls and stairs of their homes.",
  plc_13de1ac2137e57c2a74b492b4d7f5447:
    "This is a traditional market where Haeundae's everyday foods are gathered. Fish cake, tteokbokki, sashimi, and snack shops line up closely within the arcade alley.",
  plc_149c53aec2d354c4965cbaddd94fa077:
    "This is a marine museum where you can encounter the history and science of the sea. Exhibits spanning navigation, ships, marine culture, and ecology let you explore the relationship between the sea and people.",
  plc_15143b4f7dae5a5283736e6dd568a3b3:
    "This is a natural history museum where you can look at marine life from around the world. Various marine specimens and biological exhibits make it easy to learn about ocean ecology and the flow of evolution.",
  plc_17e0484fecd95deeadb5b3cbe63fa769:
    "This is a short coastal tunnel where the view opens up to the sea. At the end of the Huinnyeoul Coastal Walkway, passing through the dark tunnel reveals Yeongdo's sea framed like a picture.",
  plc_190859d4cf2e5a5999be23217f3a1544:
    "This is a hillside observatory with a red postbox overlooking Busan Harbor. Alongside a red postbox honoring the poet Yu Chi-hwan, you can take in views of Busan Harbor and the Choryang hillside road.",
  plc_1d54528e6124512681c1aeb7f881b3b8:
    "This is a souvenir space filled with Gamcheon's colors and stories. You can browse items and gifts featuring images of the village's alleys, the Little Prince, and local artists.",
  plc_1da9416a452a5ca2ae58314030de7aac:
    "This is an alley mixing hardware shops with stylish new stores. Cafes and concept shops have moved in among the old tool shops, showing both Jeonpo's industrial past and its new culture side by side.",
  plc_1e0d1ce380b95519b536910a785b056a:
    "This is a low mountain with a forest trail beside Hoedong Reservoir. Red-clay paths, cypress forest, and calm reservoir scenery continue together, making it good for a light forest walk.",
  plc_20262dbbdb2658fba0799a88d9ed55c5:
    "This is a theme park with fairy-tale themes and rides. It's a large outdoor facility where you can enjoy parades, shows, rides, and themed spaces all in one place.",
  plc_22e9b5796a385f2da4b49c490b7d0ff3:
    "This is a coastal temple set on a sea cliff. The blue sea, the main hall, and coastal rocks come together to create a scene that represents Busan's temples.",
  plc_24980989609f5ea897ce033f840d89d1:
    "This is a small indoor exhibition hall for enjoying the Little Prince theme. You can meet the Little Prince, Gamcheon Culture Village's signature image, through exhibits and an interactive photo zone.",
  plc_25c2980ad82d55ec8571e3e149810977:
    "This is a beachside walking street along Gwangan Bridge. Sea sculptures and rest areas line the beach, making it easy to enjoy the Gwangan Bridge scenery.",
  plc_2695c9a4cd805ac18acec6cff20be16e:
    "This is a nature observation center for learning about migratory birds and estuary ecology. Exhibits and viewing spaces help you understand the wetlands, migratory birds, and sandbar ecology of the Nakdong River estuary.",
  plc_26f325d3d9295d1cb70886f74411d86d:
    "This is a historic lighthouse standing on an island off Busan's coast. Amid Oryukdo's rocky islets and strong currents, you can see the lighthouse that has long guarded the approach to Busan Harbor.",
  plc_26f3d34b6586503aa0041a499e53d9ad:
    "This is a hillside walking path overlooking the sea. Along the hill road between Haeundae and Songjeong, sea views, small parks, and cafes continue one after another.",
  plc_2846d458ebfb503ca80b73e616f9dfad:
    "This is a large fish market where you can see Busan's fishing industry at work. Rather than a tourist-style market, it's a real working space centered on auctioning and distributing the catch.",
  plc_2a53c259797e5414b64973866c55129d:
    "This is a quiet temple nestled in the forest of Baegyang Mountain. Though not far from downtown, forest trails and halls blend together to make it a calm place to spend time.",
  plc_2b64bf9c3a1b5a19a8ddcb7519dd74b8:
    "This is a neighborhood park for resting beside the Myeongji residential area. With walking paths and a lawn area, it's good for a light walk or rest between sightseeing stops.",
  plc_30d561ede938527b8d3d27db590530a7:
    "This is a large park for enjoying sports and walks together. Sports and leisure facilities around the old cycling track, together with green space, make it good for spending active time.",
  plc_325adac29e825c2fba1429ffe236ce71:
    "This is a traditional market gathering North Busan's food and everyday life. Produce, seafood, snack, and household-goods stalls continue one after another, letting you feel the energy of a local market.",
  plc_33b8fd4e1497563f86722d90c2e1ff6e:
    "This is an urban mountain with wide views of Yeongdo and Busan Harbor. Climbing the ridge at the center of Yeongdo reveals views of the harbor, old downtown, and sea spreading in several directions.",
  plc_397de16e7b5750b09c7f7e3220b9889f:
    "This is a high-rise observatory looking down over Haeundae. From indoors, you can take in Haeundae Beach, Gwangan Bridge, and the city skyline all at once.",
  plc_3c231041a6d45592b71cac9536ec1e3d:
    "This is a cable car for viewing the Songdo coast from over the sea. Traveling between Songdo Beach and Amnam Park, you can admire the coastal cliffs and sea from the air.",
  plc_3c936a813fe852258a532ce9cf0ce98e:
    "This is an indoor market next to Jagalchi where you pick out seafood. Seafood stalls on the first floor connect to restaurants upstairs, so you can choose fish and eat it right away.",
  plc_3db5893bb21c527dab424022b02f31db:
    "This is an urban mountain with a view of Gwangan Bridge's night scenery. From the midslope and viewpoint sections, you can take in the city and sea of Gwangalli and Suyeongman broadly.",
  plc_3e9016d2006e5e208a6c7db3ada19c75:
    "This is a walking park on Dongbaek Island connecting forest and coast. Along a gentle coastal trail, you'll come across Nurimaru APEC House, Gwangan Bridge, and the sea at Haeundae together.",
  plc_44160ddda3ef55d2a3f3a0017552fb8f:
    "This is a wide ecological park stretching along the Nakdong River. Riverside trails, bike paths, and seasonal flower fields extend for a long stretch, making it good for enjoying open nature.",
  plc_474d6bb7ba0a583db89efee6773e5fbe:
    "This is an urban arboretum for a slow walk through forest and gardens. Various themed gardens, forest trails, and a greenhouse connect to show different scenery each season.",
  plc_47b6e277d86a53828fca4ab63870b1c3:
    "This is an observatory over the old town, set above the hillside road. It's a small viewing space where Busan Station, Bukhang Port, and the hillside houses appear layered together.",
  plc_496df8d0bdd05428a73a04d7787f5fac:
    "This is a traditional market where daytime and night market food continue together. It's a general market by day and adds various street food in the evening, so the mood changes with the time of day.",
  plc_4b311dc2f80e5395b7679e9786edc6df:
    "This is a scenic spot for viewing islands and rocks along the Gadeokdo coast. The sea, small islands, and unique rock formations blend together to create the coastal scenery of Gadeokdo.",
  plc_4cafc47a65bb5d5d8f7ef911850df4b5:
    "This is a large temple on a hillside known for its halls and lanterns. Its spacious grounds and many halls continue one after another, and it's known for a spectacular scene when the lanterns are hung.",
  plc_4d50bff1a9415b9fb7ef3dc55bfa86e3:
    "This is a small urban forest for resting beside the harbor. In this green, walkable space you can feel both Uam-dong's everyday life and the area around Busan Harbor.",
  plc_4ea79fd3100253829145953bcce40168:
    "This is a beach for surfing and a relaxed stroll. A gently sloping sandy beach, surf culture, and the scenery around Jukdo Island come together at this beach in eastern Busan.",
  plc_51e94cab443f53a789ee0343653fc035:
    "This is a coastal walking path connecting Songdo and Amnam Park. Following the trail close to the sea, you'll pass Songdo Beach, cliffs, and forest scenery in turn.",
  plc_5354c39341ee57df9e757bf0293e4cfc:
    "This is an indoor museum where you experience the filmmaking process. You can explore Busan's film history and try hands-on exhibits on shooting, editing, and special effects.",
  plc_539b2790ea3e5d02a8c5441160672098:
    "This is a flat riverside park along the Suyeong River. A wide lawn, sculptures, and a riverside trail continue together, making it good for a relaxed walk downtown.",
  plc_543e9cebb6755538b2a1b945b36d59c2:
    "This is a local church where you encounter religious architecture downtown. Through the church's architecture, blended with the surrounding alleys, you can quietly take in the neighborhood's everyday scenery.",
  plc_5882cf3e5af355febdc2762c3bb4bc48:
    "This is a boardwalk that lets you walk close over the sea. Walking the deck that extends toward the sea from Songdo Beach, you can see the coast and the cable car.",
  plc_5c04a7c7e0645ddc84e9a5b2b6e3da63:
    "This is an international exhibition center hosting large exhibitions and events. Depending on the schedule — industrial exhibitions, trade fairs, performances — it's a complex venue offering completely different content each time.",
  plc_5c1566a10d5953dbbc99e289aaca052b:
    "This is an ecological park for encountering the Nakdong River fields and migratory birds. Wide riverside wetlands, trails, and seasonal flowers continue together, making it good for enjoying quiet natural scenery.",
  plc_64e238b5b6395ae091f0b7f2b8a72442:
    "This is a food alley for tasting Busan-style street food. Bibim dangmyeon, chungmu gimbap, fish cake, and snack stalls line the narrow alley, letting you experience the taste of Busan's markets.",
  plc_667b8f23fe645b86886f9533eef87277:
    "This is a coastal space facing the Marine City night view. From the coast near the entrance to Dongbaek Island, you can admire the high-rises of Marine City and their reflection on the water.",
  plc_6a657d1dca5e5c04af0a1e83f9c94e46:
    "This is a viewpoint overlooking Busan Harbor and coastal cliffs. Beyond the rocky hill and forest trail, the scale of Sinseondae Pier and Busan Harbor spreads out before you.",
  plc_6ab8d8a91b5a59558413d460e1494ccf:
    "This is a small fishing port where lighthouses and a railway meet. Red and white lighthouses, a coastal railway, and an alley of raw fish restaurants together show eastern Busan's fishing-village scenery.",
  plc_6bfe54ffeb87561e8d3c965d340460c6:
    "This is a memorial history museum documenting forced mobilization. Through records and survivor testimonies from the forced mobilization of the Japanese colonial era, it's a space for reflecting on memory and human rights.",
  plc_6d214ab2637f5f98bd1decf4d03b8b66:
    "This is an ecological park for viewing riverside wetlands and seasonal flowers. The wide fields and waterways of the Nakdong River floodplain, and vegetation that changes with the seasons, can be seen up close.",
  plc_6e67e898acdb5169b57821d081bc5920:
    "This is an exhibition hall for encountering the lives of Yeongdo's haenyeo and sea culture. Small exhibits introduce the diving tools, life stories, and fishing-village culture of Yeongdo's haenyeo divers.",
  plc_70f6070f03a45c80bf025d3c7c9ce067:
    "This is a sea where a calm beach and fishing-village scenery continue. A gently sloping sandy beach, a small stream, and the quiet scenery of the surrounding fishing village can be enjoyed together.",
  plc_733ab1329685586187d59b83047e8459:
    "This is a citizens' park holding the memory of Busan's democratization. A memorial and exhibition space together with an outdoor park let you reflect on Busan's democratization history and rest for a while.",
  plc_770c6870fe785cc1b0efa21a3e134bd9:
    "This is an alley path connecting the stories of people from the hillside road. Behind Busan Station, stairs, old buildings, and a viewpoint continue together, letting you encounter the history of refugees and hillside-road life.",
  plc_7b131d36cd55520692bd997d64c1b3ce:
    "This is a lighthouse shining over the sea from the cliffs of Taejongdae. Against a backdrop of Taejongdae's coastal cliffs and open sea, it's a lighthouse that has long guided ships.",
  plc_7f5bf2fa8aa15798ad33ee46e617e0f7:
    "This is an island lighthouse that has watched over the southern waters of Gadeokdo. At the approach to ships entering Busan Harbor, you can see historic lighthouse architecture and open-sea views.",
  plc_7fe26eb6b8a45292899e4737dccf4314:
    "This is a sea bridge connecting Amnam Park to a rocky island. Crossing the swaying bridge over the sea, you can see Songdo's coastal cliffs and small island up close.",
  plc_802af383b8315f1383ff8d14969a43be:
    "This is a Yeongdo coastal park linking the museum and the sea. From the lawn and trail in front of the National Maritime Museum, you can leisurely take in Busan Harbor's sea and ship views.",
  plc_840292a8e463537f96409c65a10e87c6:
    "This is Busan's leading museum for contemporary art. You can explore contemporary art exhibitions from Korea and abroad, as well as the flow of Busan's regional art scene, in its indoor exhibition spaces.",
  plc_8544c080f0245d68a2470348552de674:
    "This is a quiet, secluded temple at the foot of Baegyang Mountain. Surrounded by forest and a valley, walking slowly among its halls lets you feel a mountain-temple atmosphere close to downtown.",
  plc_88db4d8ad268517b9441b1ae8040d9f1:
    "This is a coastal observatory where you look down at the sea through a glass floor. On the platform that stretches out over the water off Cheongsapo, you can feel the waves and coastline right beneath your feet.",
  plc_91aacf2399e750fbb5b16f52b9290c54:
    "This is a hillside village of colorful houses and continuing stories. An art project was added to this hillside-road village formed during the refugee era, creating a different scene in every alley.",
  plc_95578327d96158ddb15c5babeaf58bbe:
    "This is an observatory looking out over the sandbars of the Nakdong River estuary. From high up, you can observe the sandbanks where the river meets the sea, along with migratory birds and sunset views.",
  plc_956f604fe4175292858086fc8c4c4ed8:
    "This is an indoor pool and jjimjilbang facility overlooking the Haeundae sea. It's a paid rest space where you can view the sea from a high floor while using spa and water facilities.",
  plc_985646b6bb38518f8b5de6f53ff3cd61:
    "This is a cruise boat connecting the Suyeong River and Haeundae's night view. Departing from the Suyeong River, you can see the riverside city and coastal scenery from a fresh angle out on the water.",
  plc_98b87e469d055920a159344d7f17f56f:
    "This is Busan's signature mountain, home to a fortress and a temple. Ridges, valleys, the Geumjeongsanseong Fortress ruins, and Beomeosa Temple connect together, letting you experience nature and history at once.",
  plc_9a8acdbd5cbe53f08bed2a0c0e20d337:
    "This is a sea bridge that lights up Busan's nights. Seen from Gwangalli and Suyeongman, the massive bridge and its night lighting create one of Busan's signature scenes.",
  plc_9c71b2a3cb8d5ebca2cac858ee9d95ff:
    "This is Seomyeon's central street, dense with shopping and nightlife. Clothing, food, cafes, and entertainment spaces continue down every alley, letting you feel the energy of downtown Busan.",
  plc_9fd47b8889115221b196ef0508305da4:
    "This is a large fountain where music and light blend together. In front of Dadaepo Beach, you can enjoy an outdoor fountain show set to music and lighting.",
  plc_a1d1b2f796c35ac688d8f58a489ac8a6:
    "This is a specialty traditional market gathering ginseng and herbal goods. Shops specializing in ginseng, red ginseng, dried herbs, and health ingredients are all gathered in one place.",
  plc_a32c0020c23a595dae10f7d397a3b4a6:
    "This is Seodong's everyday market, winding like an alley. Snack, side-dish, and household-goods shops continue along the narrow, curving market path, letting you meet the area's daily life up close.",
  plc_a42354d8c5d854aa86415f67368daa70:
    "This is a coastal park for viewing Gwangan Bridge and the harbor at night. From the open space around Yongho Pier, you can comfortably take in the sea, Gwangan Bridge, and the city lights.",
  plc_a863af5518d6576eac8142ba84d5cac9:
    "This is a comprehensive museum connecting Busan's history and culture. You can trace Busan's artifacts and everyday culture in chronological order, from prehistoric times to the modern era.",
  plc_a877c89b9bdd5f39883de7224fefd1e2:
    "This is a local market famous for king crab and seafood. Seafood and produce from the waters off Gijang, along with king crab restaurants, form a lively local commercial district.",
  plc_a8b7c11d267254d88f49f057bd0ba2b2:
    "This is a living-history museum for learning about Nakdong River fishing-village culture. Exhibits introduce the tools, livelihoods, and everyday culture of Busan fishing communities that lived between the river and the sea.",
  plc_ad0774651c2057a0af42314a6e570ab9:
    "This is a hillside park for viewing Oryukdo and coastal cliffs. From the open, grassy hill, you can admire the sea view where Oryukdo and the East and South Seas meet.",
  plc_add9b84e40cd59b591b4d4fc20e9ba2a:
    "This is an observation tower looking down over the old town and Busan Harbor. From the tower above Yongdusan Park, you can take in Nampo-dong, Busan Harbor, and the hillside-road cityscape at a glance.",
  plc_ae153eb3280d5f6ab7fce19e91636038:
    "This is an observatory offering a sweeping view of downtown Busan and the sea. From the viewing area near the summit, you can look out over Gwangan Bridge, Haeundae, and Seomyeon in several directions.",
  plc_b06269ee4e505f3f92d245396d55f625:
    "This is an old-town park you walk together with Busan Tower. Right in the middle of Nampo-dong, you can casually take in Busan Tower, memorial sculptures, and seasonal events.",
  plc_b1c739d8630d53d8989505051bb91a16:
    "This is a history hall where you encounter Busan as South Korea's wartime provisional capital. Through the building once used as the presidential residence and its exhibits, you can look back on the politics and daily life of wartime Busan.",
  plc_b4a5ad6efabc530196b3801f42cee493:
    "This is a local market where you see Busan's energy in the early morning. From before dawn, seafood and vegetables move quickly through this working market, letting you see local merchants' daily life up close.",
  plc_b50565e25d825c29a439912e781cd232:
    "This is a steep stairway connecting the hillside road to Busan Harbor. With 168 steps linking Choryang's lower village to the high hillside road, this everyday path lets you feel the old town's elevation.",
  plc_bb13ff37d3d45266a14474004fe46d29:
    "This is a cultural space in Busan that hosts film festivals and performances. A massive roof, an outdoor theater, and screening halls come together, making it the center of the Busan International Film Festival.",
  plc_be21bdf6a07056499e3917b9a367f1a1:
    "This is a harbor village connecting the memory of ship repair to art. Named for the hammering sound of ship repair, the village still holds shipyard scenery together with public art.",
  plc_c0fe81c5eedf5b9f9adcb16e665e512c:
    "This is a large market where refugee-era history and local commerce continue. Grown from the trading of various goods after the Korean War, it's now lined with tightly packed alleys of clothing, goods, and food.",
  plc_c12c2f484e91547c8bbe259529747610:
    "This is an observatory looking down over the night view of Busan's old town. From the pedestrian deck above the hillside road, you can admire the dense night lights of Namhang, Yeongdo, and the Gamcheon area.",
  plc_c65cc649546a5c71a4d60707edb92ff0:
    "This is a tourist facility for enjoying the eastern Busan coast by train. Riding the beach train or Sky Capsule, you can see the sea continuously between Mipo, Cheongsapo, and Songjeong.",
  plc_c73bb1d2ef965af791d09b109b608cd2:
    "This is a museum for encountering Beomeosa Temple's Buddhist cultural heritage. Through Buddhist paintings, texts, and crafts preserved by the temple, you can explore the depth of Busan's Buddhist culture.",
  plc_c78f79005dfc52c1be74b32ace148974:
    "This is a shrine honoring loyalty from the Imjin War. At the shrine and memorial space dedicated to those who died defending Busan, you can reflect on the region's wartime history.",
  plc_c86d8a1892e6502f94bc1d2ecd860343:
    "This is a coastal plaza for quietly gazing out at Yeongdo's sea. From a small viewing spot midway along the Jeolyeong Coastal Walkway, you can comfortably take in the horizon and rocky coast.",
  plc_cab9cdc25f1759d380280c1857fc5b60:
    "This is a large citizens' park beside the UN Memorial Cemetery. A lawn, walking paths, and memorial sculptures continue together, making it good for a quiet rest after visiting the memorial site.",
  plc_cd81831d43dc5586ad4e5407a8cb261e:
    "This is a village where you encounter hillside-road night views and alleys. From the residential area on a steep hill, you can see downtown Busan's lights and scenery known as a filming location for dramas.",
  plc_cf859861c95c56cf81e7358962c3b0b0:
    "This is a recreational forest with trails and healing programs. In Gijang's clean forest air and gentle trails, you can spend time centered on walking and rest.",
  plc_cfe85eaff13053b88d6107ec51b6a910:
    "This is a history hall for reading the changes in modern and contemporary Busan. Housed in a former financial institution building, its exhibits trace Busan's urban, social, and economic changes since the port opened.",
  plc_d010976478ea5e018223d5f41e4670d6:
    "This is a coastal park where you walk along cliffs and sea. On a forest trail close to downtown, you'll encounter Gwangan Bridge, sea cliffs, and views toward Oryukdo one after another.",
  plc_d10e16854a205a3180a78019fd2d11de:
    "This is a coastal park for enjoying the cable car and the view together. Around the cable car arrival station, you'll find an observatory, walking trail, exhibits, and photo spots gathered together.",
  plc_d5e98ef327e05ede9a296f5daefc82d1:
    "This is Busan's leading seafood market, gathering the flavors of the sea. Tanks full of live fish, dried seafood, and harbor scenery come together, so you can pick your seafood and eat it right away.",
  plc_d767efefb94d554ea647c1fbf9f30391:
    "This is an alley where you encounter dried seafood and Busan's market scenery. Shops specializing in anchovies, seaweed, kelp, and other dried seafood continue around the Jagalchi area.",
  plc_d83912a9e7335e768152a180603f7c7d:
    "This is a history park holding traces of the Joseon-era navy. Ruins of the old Gyeongsang Jwasuyeong naval command and heritage related to loyalty remain throughout the park, showing the region's local history.",
  plc_d8f0d952ab815519b783f5941e3790d7:
    "This is a coastal walkway connecting Yeongdo's cliffs and sea. Walking the deck and stairs close to the coast, you'll see waves, rocks, and Namhang views one after another.",
  plc_e099379129c056f8ba1eb3ce7c99237d:
    "This is an outdoor sculpture park carrying a message of peace. Sculptures by artists from many countries blend with greenery, inviting you to reflect on the meaning of peace as you walk.",
  plc_e0dae06c87c85b68920deec68c2bbdf1:
    "This is a rest space for enjoying hot springs and jjimjilbang downtown. You can use various hot-spring baths and sauna rooms in one place to relax from the fatigue of traveling.",
  plc_e503b78fa4f05ead9b2a0dc8af594583:
    "This is an urban mountain in central Busan offering views in every direction. From the ridge and beacon-mound area, you can look widely toward Seomyeon, Gwangalli, Haeundae, and Busan Harbor.",
  plc_e59fbc7557385d90bac781dc7cbc38cf:
    "This is a neighborhood park for a light walk in downtown Sasang. With walking paths and exercise and rest areas, it's good for a short break while moving around, or for feeling the area's daily life.",
  plc_e848ee49dfc85f43923d9e32c171044b:
    "This is a memorial park honoring Korean War veterans. At the world's only UN cemetery, you can reflect on the sacrifice of those who fought in the Korean War and the meaning of international solidarity.",
  plc_e92c350f8705521b90acc7afbe59c373:
    "This is a complex cultural space for enjoying sea views and food. Dining shops, pop-up and event spaces, and indoor stepped seating facing Gwangan Bridge are all gathered in one place.",
  plc_ee706dc160f85b66a18debc397f71cb9:
    "This is a privately managed forest with long-tended bamboo and forest trails. Dense bamboo, Korean red pine, and winding dirt paths continue together, letting you feel the deep, quiet mood of Gijang's forest.",
  plc_f182c443a19551a482a3350df4c7eb4c:
    "This is a city where high-rises and coastal night views come together. Along the Haeundae shoreline, skyscrapers, yachts, and Gwangan Bridge create a modern Busan scene.",
  plc_f240a837db8150ea8571a3673c1b32c0:
    "This is a large hot-spring facility using Dongnae's hot-spring water. Various hot-spring baths and rest areas let you experience the water and bathing culture of Dongnae hot springs.",
  plc_f2fc176194865241972e2f0ab0d63d23:
    "This is an observatory for viewing Oryundae Reservoir and the mountain ridges. From a high viewpoint, you can take in the reservoir's winding waterway and the surrounding mountains at a glance.",
  plc_f49f2e2e5dec57a9a616344ce3b1ef7b:
    "This is Busan's leading beach, facing Gwangan Bridge. A wide sandy beach, a cafe street, and Gwangan Bridge's night view blend together, giving the beach a distinctly different mood by day and by night.",
  plc_f874dd4109bf5cc1b8f7d5f8bbc9f849:
    "This is a small observatory looking out over the hillside road and Busan Harbor. From above the Choryang hillside road, you can look down closely at Busan Station, Bukhang Port, and the stepped housing.",
  plc_fb4d8319e0e55bce8c4b8b8aa8aa3573:
    "This is a beach connected by a cable car and a coastal boardwalk. At one of Busan's oldest beaches, the Cloud Trail and the cable car come together to offer a variety of coastal experiences.",
  plc_fc0f510b7b185fbfa70b6ce17549c1a2:
    "This is a hot-spring jjimjilbang facility for resting near Taejongdae. It's an indoor rest stop where you can relax in hot-spring baths and sauna rooms before or after visiting Taejongdae.",
  plc_fcb85af986795cd195d613183288c4f7:
    "This is a space holding both international conference history and sea views. At the conference hall at the tip of Dongbaek Island, you can look back on the 2005 APEC Summit and Busan's role as an international city.",
  plc_fe870f5beb4e51799f89aa43f37150ac:
    "This is an old-town pedestrian street connecting shopping and culture. Along the wide street centered on Nampo-dong, fashion stores, cafes, and seasonal decorations continue on both sides.",
};

async function main() {
  const client = new MongoClient(mongoUri!);
  await client.connect();
  const placeInfo = client.db("cultural_fit_busan").collection("place_info");

  const writes = Object.entries(GUIDE_SIMPLE_EN).map(([placeId, guideSimpleEn]) => ({
    updateOne: { filter: { placeId }, update: { $set: { guideSimpleEn } } },
  }));

  const result = await placeInfo.bulkWrite(writes);
  console.log(`적재 완료: ${result.matchedCount}건 갱신 (${writes.length}건 중)`);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
