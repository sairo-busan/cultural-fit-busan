/**
 * guideTipsRawEn 채우기 (BE-FEAT-015, LLM 번역).
 *
 * place_info.guideTipsRawKo(119건, "관람 순서: …\n사진 포인트: …\n유의사항: …")를
 * 영문으로 옮겨 guideTipsRawEn에 저장한다. 라벨도 영문("Route:"/"Photo spot:"/
 * "Caution:")으로 번역 — 한국어와 같은 3줄 구조를 유지해 placeDetail.ts의
 * parseTips와 대칭되는 파서를 나중에 붙이기 쉽게 한다.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/fill-guide-tips-en.ts
 */

import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

const GUIDE_TIPS_EN: Record<string, string> = {
  plc_022169e454dd5c9ba5fad5c1c5de4b50:
    "Route: See the stairs and sculptures around the 40 Stairs Memorial Hall, then continue up the alley above.\nPhoto spot: Frame the stairs and sculptures together from below.\nCaution: If the stairs are hard to use, check the detour route nearby first.",
  plc_03de50b9eb255edbad96975ab563f81e:
    "Route: Walk the reservoir loop trail from the main gate, then visit the children's facilities that interest you.\nPhoto spot: The trail where the reservoir water and forest appear together is a good choice.\nCaution: Check the operating hours and closed days of the children's facilities before you visit.",
  plc_08ce0955a14257eb9b3f2963d30cbd72:
    "Route: See the permanent exhibition first, then move to the outdoor tomb cluster — the site's layout reads more clearly that way.\nPhoto spot: From behind the museum, capture the tombs together with the Dongnae cityscape.\nCaution: Check on-site whether photography is allowed in the galleries and whether a special exhibition is running.",
  plc_092ae16ed85d5c50a2500baa73b90b23:
    "Route: Focus on the permanent exhibition hall first, then choose either the Children's Science Museum or the planetarium.\nPhoto spot: Capture the large exhibits together with people trying the hands-on activities.\nCaution: Some exhibition halls may require separate reservations or tickets.",
  plc_0d048ddb22ff5e8f9e72ab2c80736ef9:
    "Route: Start at the alley entrance and walk up slowly, taking in the bookshelves and stepped lanes in order.\nPhoto spot: Capture the stacked bookshelves together with the stairstep alley.\nCaution: Ask the shop first before flipping through books or taking photos.",
  plc_0f26be5211f2512990509cd4130c720c:
    "Route: Check the information point first, then walk slowly through the alleys with tombstone traces and the viewpoint section.\nPhoto spot: Capture the tombstone traces in the retaining wall together with the hillside road view.\nCaution: Some alleys are steep with little signage, so a daytime visit is safer.",
  plc_13de1ac2137e57c2a74b492b4d7f5447:
    "Route: Start with the street food near the market entrance, then move to the restaurant area inside.\nPhoto spot: Capture the signs and food stalls lined up under the arcade.\nCaution: Watch out for hot cooking surfaces and narrow aisles, and mention any food allergies in advance.",
  plc_149c53aec2d354c4965cbaddd94fa077:
    "Route: Follow the permanent exhibition upstairs, then visit the aquarium and the ocean-view area.\nPhoto spot: Capture the curved building together with the sea and the large exhibits.\nCaution: Check whether special exhibitions and experience zones require a separate reservation.",
  plc_15143b4f7dae5a5283736e6dd568a3b3:
    "Route: Follow the permanent exhibition in its classification order, then go back to specimens that interest you.\nPhoto spot: The large, uniquely shaped marine specimens make good subjects.\nCaution: Avoid flash photography and touching the exhibits to protect the specimens.",
  plc_17e0484fecd95deeadb5b3cbe63fa769:
    "Route: Go down from the Huinnyeoul coastal path into the tunnel, walk through, and continue to the sea view on the other side.\nPhoto spot: From inside the tunnel, frame the sea beyond the exit like a silhouette.\nCaution: On days with strong waves or wind, check coastal access conditions first.",
  plc_190859d4cf2e5a5999be23217f3a1544:
    "Route: Take in the harbor view from the observatory, then continue along the stairs and alleys of nearby Ibagu-gil.\nPhoto spot: Frame the shot so Busan Harbor appears beyond the red postbox.\nCaution: This is next to a residential area, so keep noise down and watch for passing vehicles.",
  plc_1d54528e6124512681c1aeb7f881b3b8:
    "Route: After touring the village, browse the souvenir area near the official information center for what you need.\nPhoto spot: Capture postcards and items in Gamcheon's colors together with the backdrop.\nCaution: Keep residents' living spaces separate from the private shops you visit.",
  plc_1da9416a452a5ca2ae58314030de7aac:
    "Route: From the main street, turn into the hardware shop alley and look at the old signs and new stores in turn.\nPhoto spot: Frame the old tool signs together with the new shops in one shot.\nCaution: Always ask permission before photographing people at work or shop interiors.",
  plc_1e0d1ce380b95519b536910a785b056a:
    "Route: From the entrance, follow the red-clay trail out to the reservoir viewpoint and back.\nPhoto spot: The curved path where Hoedong Reservoir shows through the trees is a good choice.\nCaution: If using the barefoot section, check where to wash your feet and the trail conditions first.",
  plc_20262dbbdb2658fba0799a88d9ed55c5:
    "Route: After entering, ride the popular attractions first, then head to the central area in time for the shows.\nPhoto spot: Capture the plaza in front of the castle during the parade.\nCaution: Be sure to check height/age restrictions and rain-closure information.",
  plc_22e9b5796a385f2da4b49c490b7d0ff3:
    "Route: Pass the zodiac statues at the entrance, go down the stairs, and tour the temple grounds followed by the coastal view.\nPhoto spot: From across the grounds, frame the temple and the sea together in one shot.\nCaution: Respect temple etiquette and don't climb down past the railing onto the coastal rocks.",
  plc_24980989609f5ea897ce033f840d89d1:
    "Route: Walk the village alleys, then stop by the exhibition hall for the display and photo zone in order.\nPhoto spot: Capture the Little Prince sculpture together with Gamcheon's colors.\nCaution: Keep to the photo zone queue line and don't lean on the exhibits.",
  plc_25c2980ad82d55ec8571e3e149810977:
    "Route: From the center of the beach, pick either the Millak or Namcheon direction and walk slowly.\nPhoto spot: Frame the Gwangan Bridge showing through the sculptures.\nCaution: On days with high waves, stay away from the waterline and breakwater edges.",
  plc_2695c9a4cd805ac18acec6cff20be16e:
    "Route: See the indoor exhibition first, then move to the trail and bird-watching points.\nPhoto spot: From beyond the observation window, capture the wetland and birds taking flight from a distance.\nCaution: Keep your voice down and don't feed the wildlife, so as not to startle them.",
  plc_26f325d3d9295d1cb70886f74411d86d:
    "Route: First view Oryukdo from the land viewpoint, and only plan a sea approach once boarding availability is confirmed.\nPhoto spot: From the land observatory, frame the islands and lighthouse in a telephoto shot.\nCaution: Don't try to enter the islands without official permission and confirmed sailing.",
  plc_26f3d34b6586503aa0041a499e53d9ad:
    "Route: From the start of Dalmaji-gil, head toward Haewoljeong and pick out the spots where the view opens up.\nPhoto spot: The curved road where the sea at Haeundae opens up through the trees is a good choice.\nCaution: Traffic can be heavy during cherry blossom season and on weekends.",
  plc_2846d458ebfb503ca80b73e616f9dfad:
    "Route: Follow the open perimeter path and designated viewing area to take in the market's scale and workflow.\nPhoto spot: An outside spot where the harbor and market building appear together is safer.\nCaution: Don't block the work paths or photograph the interior and workers without permission.",
  plc_2a53c259797e5414b64973866c55129d:
    "Route: Enter the grounds through the one-pillar gate, see the main halls, then take a slow walk through the forest scenery.\nPhoto spot: Frame the temple roofline against the forest backdrop.\nCaution: The mountain paths have slopes, so be careful of slippery ground after rain.",
  plc_2b64bf9c3a1b5a19a8ddcb7519dd74b8:
    "Route: Walk one loop around the park, then rest a while in the shade or on a bench.\nPhoto spot: Capture the wide paths lined with seasonal plantings.\nCaution: Keep the paths clear for people using the playground and exercise areas.",
  plc_30d561ede938527b8d3d27db590530a7:
    "Route: Decide which sports facility to visit first, then continue along the park's walking trail.\nPhoto spot: A spot where the open plaza and stadium exterior appear together works well.\nCaution: Watch your surroundings where bike and pedestrian paths cross.",
  plc_325adac29e825c2fba1429ffe236ce71:
    "Route: From the market entrance, pass through the food alley and walk slowly into the inner general market area.\nPhoto spot: Capture the market aisle lined with old signs and stalls.\nCaution: Check prices and origin, and ask vendors before photographing them.",
  plc_33b8fd4e1497563f86722d90c2e1ff6e:
    "Route: Choose a trail that matches your fitness level and walk out to the viewpoint and back.\nPhoto spot: From the viewpoint, a shot showing Busan Harbor together with Yeongdo's residential area is a good choice.\nCaution: Avoid summiting in fog, strong wind, or rain.",
  plc_397de16e7b5750b09c7f7e3220b9889f:
    "Route: After entering, go around the floor's viewing areas and take in the sea and city sides separately.\nPhoto spot: From the window, frame Haeundae's curve together with the city skyline.\nCaution: To reduce glass reflection, hold the camera close to the glass but don't lean on it.",
  plc_3c231041a6d45592b71cac9536ec1e3d:
    "Route: Board at Songdo Bay Station, tour Sky Park, then return round-trip or one-way.\nPhoto spot: From inside the cabin, frame the coastline together with the opposite cabin.\nCaution: Check operating status and round-trip vs. one-way tickets, and avoid moving seats during the ride.",
  plc_3c936a813fe852258a532ce9cf0ce98e:
    "Route: Check prices and species on the first floor and the restaurant terms, then go up to the floor above.\nPhoto spot: Capture the indoor aisle where the fish tanks and market signs continue.\nCaution: Watch for wet floors and mention food allergies or raw-food concerns in advance.",
  plc_3db5893bb21c527dab424022b02f31db:
    "Route: Climb from the entry point to a good viewpoint section, take in the view, then return safely by the same path.\nPhoto spot: The scene at dusk when Gwangan Bridge and the city lights come on together is a good choice.\nCaution: Stay away from beyond the railings, and postpone your visit if wind or fog is strong.",
  plc_3e9016d2006e5e208a6c7db3ada19c75:
    "Route: From the Haeundae-side entrance, walk the coastal path one loop through Nurimaru and the lighthouse viewpoint.\nPhoto spot: A spot near the lighthouse where Gwangan Bridge and the sea appear together is a good choice.\nCaution: Stay away from the coastal edge on days with rain or strong waves.",
  plc_44160ddda3ef55d2a3f3a0017552fb8f:
    "Route: Choose your parking and entry point, then take a short round trip along the riverside trail.\nPhoto spot: A low-angle shot with the riverside and seasonal flowers together works well.\nCaution: Don't enter the bike-only section, and check access conditions after heavy rain.",
  plc_474d6bb7ba0a583db89efee6773e5fbe:
    "Route: Pick a signature garden from the map, then connect the greenhouse and outdoor trail.\nPhoto spot: A spot showing the depth of the forest path together with seasonal flowers is a good choice.\nCaution: Don't touch or pick the plants, and stay on the designated paths.",
  plc_47b6e277d86a53828fca4ab63870b1c3:
    "Route: Connect with Ibagu-gil to see the observatory first, then take a short walk through the nearby stepped alleys.\nPhoto spot: Frame Bukhang Port and the old town within the observatory's structure.\nCaution: Watch for vehicles in the alleys and steep stairs, and don't photograph residents' spaces.",
  plc_496df8d0bdd05428a73a04d7787f5fac:
    "Route: Walk the daytime market aisles, then continue to the food area once the night market opens.\nPhoto spot: The long row of signs and food stalls under the arcade makes a good scene.\nCaution: Watch for hot cooking surfaces and crowded aisles, and dispose of trash in the designated spots.",
  plc_4b311dc2f80e5395b7679e9786edc6df:
    "Route: Take in the overall shape from a safe land viewpoint first, then look around the coastal scenery nearby.\nPhoto spot: A coastal composition where the island and rocks line up is a good choice.\nCaution: Don't climb onto wet rocks or the end of the breakwater, and follow access restrictions.",
  plc_4cafc47a65bb5d5d8f7ef911850df4b5:
    "Route: Go up from the one-pillar gate toward the main hall, seeing the major halls and the grounds view in order.\nPhoto spot: A composition with the tiered lanterns overlapping the hall rooflines is a good choice.\nCaution: Don't disturb worship and practice spaces, and check the drone and tripod rules.",
  plc_4d50bff1a9415b9fb7ef3dc55bfa86e3:
    "Route: Take a short loop on the park trail and look for spots where the view opens up and rest areas.\nPhoto spot: Capture the harbor and neighborhood showing through the trees.\nCaution: Lighting can be dim at night, so visit during daylight hours.",
  plc_4ea79fd3100253829145953bcce40168:
    "Route: From the center of the beach, walk toward Jukdo and take in the sea and the café street together.\nPhoto spot: A scene with Jukdo, the curve of the beach, and surfers together is a good choice.\nCaution: Avoid swimming outside the safety line and entering the water-sports equipment path.",
  plc_51e94cab443f53a789ee0343653fc035:
    "Route: Start at Songdo Beach and walk the coastal section toward Amnam Park.\nPhoto spot: A curved section where the coastal cliffs and blue sea overlap for a long stretch is a good choice.\nCaution: On days with rain or strong wind, check the coastal path's access status.",
  plc_5354c39341ee57df9e757bf0293e4cfc:
    "Route: Follow the permanent exhibition through film history, then try the filming and sound experience zones.\nPhoto spot: Capture yourself appearing directly in the video experience scenes.\nCaution: Check the photography rules and closed days for the screening and experience areas.",
  plc_539b2790ea3e5d02a8c5441160672098:
    "Route: From the park entrance, follow the riverside trail through the sculpture section and around the lawn.\nPhoto spot: Capture the Suyeong River and Centum buildings beyond the sculptures.\nCaution: Watch your surroundings where bike and pedestrian paths overlap.",
  plc_543e9cebb6755538b2a1b945b36d59c2:
    "Route: See the exterior architecture first, then view the interior only during open hours and permitted areas.\nPhoto spot: From the alley, frame the building's facade together with the surrounding scenery.\nCaution: Avoid entering during services and photographing congregants; follow on-site guidance.",
  plc_5882cf3e5af355febdc2762c3bb4bc48:
    "Route: Walk from the beach entrance to the end of the boardwalk, then return the same way and continue to the beach.\nPhoto spot: Capture the deck's curve together with the Songdo coast and cable car in one frame.\nCaution: Don't run on wet decking or glass sections, and don't lean on the railings.",
  plc_5c04a7c7e0645ddc84e9a5b2b6e3da63:
    "Route: Check the hall number and entrance for the event you're visiting, then follow the signposted route.\nPhoto spot: A scene with the event banners and the wide exhibition hall exterior together works well.\nCaution: Photography, re-entry, and item rules vary by event.",
  plc_5c1566a10d5953dbbc99e289aaca052b:
    "Route: Choose an entry point, then take a round trip on either the flower path or the riverside trail.\nPhoto spot: A composition with the long flower path and the wide Nakdong River sky is a good choice.\nCaution: Check for flooding after heavy rain and follow bird-protection area access rules.",
  plc_64e238b5b6395ae091f0b7f2b8a72442:
    "Route: Look over the menus and prices first, then share a few dishes as you move through the alley.\nPhoto spot: Capture the food on the stalls together with the handwritten menu boards.\nCaution: Check for spicy, seafood, or allergy ingredients before ordering.",
  plc_667b8f23fe645b86886f9533eef87277:
    "Route: After a walk around Dongbaek Island, tour the outdoor deck and the coastal viewpoint in order.\nPhoto spot: Capture the Marine City lights reflected on the water at a low angle.\nCaution: Be careful using a tripod near the coastal edge and on the crowded deck.",
  plc_6a657d1dca5e5c04af0a1e83f9c94e46:
    "Route: From the park entrance, climb to the viewpoint and take in the harbor and coastal sides separately.\nPhoto spot: A composition from the observatory with the port cranes and sea together is a good choice.\nCaution: Don't go past the trail edges or into restricted areas.",
  plc_6ab8d8a91b5a59558413d460e1494ccf:
    "Route: See the railway near Cheongsapo Station, then walk slowly toward the harbor and lighthouses.\nPhoto spot: Capture the two lighthouses, the sea, and a passing beach train together.\nCaution: Don't enter the railway or take risky photos at the end of the breakwater.",
  plc_6bfe54ffeb87561e8d3c965d340460c6:
    "Route: Understand the historical background in the introductory exhibit, then move slowly through the materials and memorial space in order.\nPhoto spot: Capture the restrained structure of the building and memorial space.\nCaution: Respect the victims' materials and memorial space, and avoid casual photography.",
  plc_6d214ab2637f5f98bd1decf4d03b8b66:
    "Route: From the entry point near the floodgate, take a short round trip along the riverside path.\nPhoto spot: A composition with the waterway, fields, and wide sky together is a good choice.\nCaution: Don't enter the wetland, and don't enter farming or managed areas.",
  plc_6e67e898acdb5169b57821d081bc5920:
    "Route: See the exhibition first, then take in the actual work area's scenery from a distance along the nearby coast.\nPhoto spot: Capture the exhibited tools together with the sea view through the window.\nCaution: Ask permission before photographing haenyeo divers and equipment actually at work.",
  plc_70f6070f03a45c80bf025d3c7c9ce067:
    "Route: From the center of the beach, walk slowly toward the stream and breakwater, taking in the scenery.\nPhoto spot: A scene with the sandy beach and the low fishing-village skyline continuing together is a good choice.\nCaution: Check the safety line and wave conditions, and stay away from the end of the breakwater.",
  plc_733ab1329685586187d59b83047e8459:
    "Route: See the exhibition at the Democracy Movement Memorial Hall, then tour the outdoor sculptures and viewpoint.\nPhoto spot: A spot where the memorial sculpture and Busan's old town appear together is a good choice.\nCaution: Stay quiet in the memorial space and follow the photography guidance for exhibits.",
  plc_770c6870fe785cc1b0efa21a3e134bd9:
    "Route: From the Busan Station side, go up in order through the Wall Gallery, the 168 Steps, and the viewpoint.\nPhoto spot: A scene where Busan Harbor and old houses overlap through the stairs is a good choice.\nCaution: This is a residential alley, so don't photograph windows or inside homes.",
  plc_7b131d36cd55520692bd997d64c1b3ce:
    "Route: Follow the Taejongdae loop path to take in both the lighthouse viewpoint and the coastal cliffs.\nPhoto spot: Frame the white lighthouse, blue sea, and cliffs together in one shot.\nCaution: Don't go beyond the railings or into restricted areas, and watch for strong winds.",
  plc_7f5bf2fa8aa15798ad33ee46e617e0f7:
    "Route: Check official opening and reservation status first, then visit only the marked areas and route.\nPhoto spot: A spot where the old lighthouse building and the sea horizon appear together is a good choice.\nCaution: Don't photograph or approach unauthorized areas and facilities.",
  plc_7fe26eb6b8a45292899e4737dccf4314:
    "Route: Check ticketing and operating status at Amnam Park, then cross the bridge round-trip and tour the viewpoint.\nPhoto spot: From the middle of the bridge, capture the coastal cliffs and sea in a long shot.\nCaution: Follow operating restrictions, and don't run on the bridge or reach items past the railing.",
  plc_802af383b8315f1383ff8d14969a43be:
    "Route: After the museum tour, follow the coastal path through the lawn plaza and viewpoint section.\nPhoto spot: A composition with the wide lawn and the museum and sea beyond is a good choice.\nCaution: Watch your surroundings at the coastal edge and the bike path section.",
  plc_840292a8e463537f96409c65a10e87c6:
    "Route: Check the current exhibition list, then tour the floor galleries and outdoor works in order.\nPhoto spot: A spot where the building's lines and outdoor sculptures appear together is a good choice.\nCaution: Follow the photography rules and no-flash guidance for each work.",
  plc_8544c080f0245d68a2470348552de674:
    "Route: From the entrance, go up to the grounds and tour the main halls and the surrounding forest path in order.\nPhoto spot: A composition with the halls and stone steps continuing through the forest is a good choice.\nCaution: Check on-site guidance for interior photography and accessible areas.",
  plc_88db4d8ad268517b9441b1ae8040d9f1:
    "Route: Check the shoe covers and safety guidance at the entrance, then walk slowly to the far end of the viewing platform.\nPhoto spot: Frame the platform's curve continuing in one direction with the blue sea.\nCaution: Don't run on the glass floor or reach your phone past the railing.",
  plc_91aacf2399e750fbb5b16f52b9290c54:
    "Route: Check the route at the information center, then connect the main alleys, the Little Prince sculpture, and the viewpoint.\nPhoto spot: A spot where the stepped houses overlap behind the Little Prince sculpture is a good choice.\nCaution: Avoid photographing doors and windows, and don't block residents' passageways.",
  plc_95578327d96158ddb15c5babeaf58bbe:
    "Route: Understand the estuary ecology through the indoor exhibits, then take in the outside view from the floor viewing areas.\nPhoto spot: A composition at dusk with the sandbars and river layered together is a good choice.\nCaution: Avoid flash and loud noise toward the birds, and be considerate when using telephoto gear.",
  plc_956f604fe4175292858086fc8c4c4ed8:
    "Route: After completing entry procedures, use the spa and water areas, then move to the view/rest area.\nPhoto spot: A window scene with the Haeundae sea and the indoor water surface together is a good choice.\nCaution: Follow each facility's safety rules and phone photography restrictions.",
  plc_985646b6bb38518f8b5de6f53ff3cd61:
    "Route: Arrive early at the pier, get boarding guidance, then view from your assigned seat and deck.\nPhoto spot: The moment when Gwangan Bridge and Marine City appear together from the water is a good choice.\nCaution: Follow life-jacket and crew guidance, and don't lean on the railing while moving.",
  plc_98b87e469d055920a159344d7f17f56f:
    "Route: Choose one route among Beomeosa Temple, Sanseong Village, or Godangbong based on your fitness level.\nPhoto spot: A ridge section where the fortress wall and the Busan cityscape spread out together is a good choice.\nCaution: Avoid hiking in bad weather or after sunset, and stick to the marked trails.",
  plc_9a8acdbd5cbe53f08bed2a0c0e20d337:
    "Route: Find a spot at Gwangalli Beach or Millak Waterside Park where the whole bridge is visible.\nPhoto spot: A scene at dusk with the water reflection and bridge lighting together is a good choice.\nCaution: Don't approach the roadway or breakwater, and follow control guidance during events.",
  plc_9c71b2a3cb8d5ebca2cac858ee9d95ff:
    "Route: Walk the main street from Seomyeon Station, then turn into a food alley or shopping street that interests you.\nPhoto spot: A street scene with neon signs and passersby overlapping is a good choice.\nCaution: Watch for vehicles entering the alleys and keep an eye on your belongings.",
  plc_9fd47b8889115221b196ef0508305da4:
    "Route: Check the show schedule and get a spot early, then continue on to the beach sunset afterward.\nPhoto spot: Capture the evening sky showing behind the fountain lights.\nCaution: Keep the swimming area and viewing area separate, and watch for slippery surfaces.",
  plc_a1d1b2f796c35ac688d8f58a489ac8a6:
    "Route: Walk the market aisles first, then compare origin, grade, and price before choosing what you need.\nPhoto spot: Capture a shop with ginseng and herbs neatly displayed.\nCaution: Check origin, weight, and return conditions before buying, and avoid photographing without permission.",
  plc_a32c0020c23a595dae10f7d397a3b4a6:
    "Route: Check the entrance signage, pass the main food area, then walk slowly to the market's inner section.\nPhoto spot: A composition showing the depth of the low signs and winding market alley is a good choice.\nCaution: Ask permission before photographing vendors and goods up close.",
  plc_a42354d8c5d854aa86415f67368daa70:
    "Route: Arrive at the park around dusk and take a short walk through the coastal path and viewpoint.\nPhoto spot: A scene with the Gwangan Bridge lights and their reflection on the water together is a good choice.\nCaution: Watch for the coastal edge and passing bikes or kickboards.",
  plc_a863af5518d6576eac8142ba84d5cac9:
    "Route: See the permanent exhibition in chronological order, then continue to the outdoor stonework and cultural experience space.\nPhoto spot: Record the signature artifacts together with the exhibition hall's period layout.\nCaution: Avoid flash and touching the exhibits to protect the artifacts.",
  plc_a877c89b9bdd5f39883de7224fefd1e2:
    "Route: Browse the seafood section and compare prices, then check the restaurant's cooking and table-setting terms.\nPhoto spot: A lively scene with king crab tanks and market signs continuing together is a good choice.\nCaution: Confirm the total price, extra charges, and origin before ordering.",
  plc_a8b7c11d267254d88f49f057bd0ba2b2:
    "Route: See the fishing tools in the permanent exhibition, then continue to the space related to Nakdong River ecology.\nPhoto spot: A display scene with boats and fishing gear models together is a good choice.\nCaution: Avoid touching the exhibits and flash photography.",
  plc_ad0774651c2057a0af42314a6e570ab9:
    "Route: Follow the park's walking trail through the viewpoint and toward the skywalk in order.\nPhoto spot: A wide composition where Oryukdo shows beyond the hill's curve is a good choice.\nCaution: Don't approach the cliff edge or restricted areas.",
  plc_add9b84e40cd59b591b4d4fc20e9ba2a:
    "Route: Tour the park first, then go up the tower to see the directional views and exhibition space in order.\nPhoto spot: A scene where Busan Harbor and the hillside road overlap beyond the viewing window is a good choice.\nCaution: Don't lean on the glass, and check operating hours and ticket conditions.",
  plc_ae153eb3280d5f6ab7fce19e91636038:
    "Route: From the parking/drop-off point, go up to the observatory and follow the directional signs to take in the city.\nPhoto spot: From near the beacon mound, capture Gwangan Bridge and the city lights broadly.\nCaution: Avoid parking at the roadside and don't go beyond the railings.",
  plc_b06269ee4e505f3f92d245396d55f625:
    "Route: Go up via the Gwangbok-ro escalator, see the plaza and sculptures, then continue to Busan Tower.\nPhoto spot: A central composition with Busan Tower and the plaza sculptures together is a good choice.\nCaution: Follow the control lines and viewing route during events.",
  plc_b1c739d8630d53d8989505051bb91a16:
    "Route: Follow the rooms and exhibition route of the residence building, then take a slow walk through the outdoor garden.\nPhoto spot: A spot where the old residence's exterior and garden appear together is a good choice.\nCaution: Avoid indoor flash photography and touching the exhibits.",
  plc_b4a5ad6efabc530196b3801f42cee493:
    "Route: Follow the open path around sunrise to take in the market's flow, then continue toward Jagalchi.\nPhoto spot: A market scene with boxes and hand carts moving in the morning light is a good choice.\nCaution: Don't block work paths, and ask permission before photographing vendors and goods.",
  plc_b50565e25d825c29a439912e781cd232:
    "Route: See the view from the top from the bottom of the stairs, then climb at your own pace and continue to Ibagu-gil.\nPhoto spot: From the middle of the stairs, capture the tiered path together with Busan Harbor.\nCaution: The stairs get slippery in rain or snow, and it's a residents' walkway, so don't block the path.",
  plc_bb13ff37d3d45266a14474004fe46d29:
    "Route: See the outdoor plaza and building first, then use the indoor space according to the screening/exhibition schedule.\nPhoto spot: A wide shot at dusk with the roof lighting and outdoor plaza is a good choice.\nCaution: Follow the no-photography rule during screenings/performances and the event control lines.",
  plc_be21bdf6a07056499e3917b9a367f1a1:
    "Route: Check the route at the village information center, then connect the alley artworks with the harbor viewpoint.\nPhoto spot: A harbor scene with the cranes and repair ships showing beyond the murals is a good choice.\nCaution: Don't enter workshops or photograph workers without permission.",
  plc_c0fe81c5eedf5b9f9adcb16e665e512c:
    "Route: Check the market zone map, choose an alley for the items you want, then connect to the food alley.\nPhoto spot: An alley with old signs and goods lined up for a long stretch is a good choice.\nCaution: Ask permission before photographing vendors, and mind your belongings in crowded aisles.",
  plc_c12c2f484e91547c8bbe259529747610:
    "Route: Follow the lit deck to the viewpoint, then return safely by the same path.\nPhoto spot: A composition where the harbor and house lights layer beyond the deck railing is a good choice.\nCaution: Don't disturb residents, and watch for dark stairs and vehicles.",
  plc_c65cc649546a5c71a4d60707edb92ff0:
    "Route: Choose your starting station and direction, then connect to your destination stop by train or sky capsule.\nPhoto spot: The sea-side window view heading from Mipo toward Cheongsapo is a good choice.\nCaution: Don't enter the tracks, and check boarding times and your stop in advance.",
  plc_c73bb1d2ef965af791d09b109b608cd2:
    "Route: See the museum exhibition first, then continue to the halls and stonework on the Beomeosa Temple grounds.\nPhoto spot: Where permitted, record the detailed patterns of the Buddhist paintings and crafts.\nCaution: Respect the religious cultural heritage, and avoid flash and touching the exhibits.",
  plc_c78f79005dfc52c1be74b32ace148974:
    "Route: Read the information at the entrance, then tour the memorial hall, shrine, and grounds garden in order.\nPhoto spot: A symmetrical composition with the red gate and the shrine above the stairs is a good choice.\nCaution: Avoid loud noise and casual photography in the memorial space.",
  plc_c86d8a1892e6502f94bc1d2ecd860343:
    "Route: Spend some time at the plaza, then continue along part of the Jeolyeong Coastal Walkway based on your fitness level.\nPhoto spot: Capture the rocky coast and wide horizon beyond the railing.\nCaution: Watch for coastal stairs and wet surfaces.",
  plc_cab9cdc25f1759d380280c1857fc5b60:
    "Route: Follow the park trail to see the sculptures, then continue to the UN Memorial Cemetery or Busan Museum.\nPhoto spot: A scene with the wide lawn, memorial sculptures, and trees together is a good choice.\nCaution: Check for event areas and bike traffic, and follow lawn-protection guidance.",
  plc_cd81831d43dc5586ad4e5407a8cb261e:
    "Route: Take in the view near Hocheon Culture Platform, then take a short walk through the open alley route only.\nPhoto spot: A scene where rooftops and city lights layer together from the viewpoint is a good choice.\nCaution: Don't photograph house windows or residents, and don't block the alley passage.",
  plc_cf859861c95c56cf81e7358962c3b0b0:
    "Route: Check trail conditions at the information center, then use a forest path and rest area matching your fitness level.\nPhoto spot: A quiet forest path with sunlight coming through the trees is a good choice.\nCaution: Stay on the designated trail, and prepare for insects and slippery ground.",
  plc_cfe85eaff13053b88d6107ec51b6a910:
    "Route: See the permanent exhibition in chronological order, then take in the building's historic traces together with the surrounding old town.\nPhoto spot: A spot where the old building's exterior and old town streets appear together is a good choice.\nCaution: Follow the photography rules to help protect the materials and exhibits.",
  plc_d010976478ea5e018223d5f41e4670d6:
    "Route: Based on your fitness level, choose one section — Dongsaengmal, Eoultmadang, or Oryukdo — and walk it.\nPhoto spot: A section where Gwangan Bridge shows beyond the coastal cliffs is a good choice.\nCaution: Avoid the rocky coast in rain or strong wind, and stick to the marked path.",
  plc_d10e16854a205a3180a78019fd2d11de:
    "Route: After getting off the cable car, tour the viewpoint and park facilities, then continue to the Yonggung Cloud Bridge.\nPhoto spot: A viewpoint with the cable car and Songdo sea together is a good choice.\nCaution: Stay away from beyond the railings and keep to the photo-zone queue line.",
  plc_d5e98ef327e05ede9a296f5daefc82d1:
    "Route: Compare species and prices on the first floor, check the restaurant's table-setting terms, then go up to the floor above.\nPhoto spot: A scene where the harbor shows beyond the fish tanks and market signs is a good choice.\nCaution: Check for raw food and allergy concerns, and ask permission before photographing vendors.",
  plc_d767efefb94d554ea647c1fbf9f30391:
    "Route: Walk one loop through the alley comparing quality and price, then check packaging options.\nPhoto spot: Shelves stacked with dried seafood and old signs are a good choice.\nCaution: Check origin, weight, and storage method, and ask vendors before photographing.",
  plc_d83912a9e7335e768152a180603f7c7d:
    "Route: Follow the signs to see the fortress traces, memorial space, and old trees in order.\nPhoto spot: A composition with old trees, traditional architecture, and stone walls together is a good choice.\nCaution: Don't climb onto the cultural heritage or make loud noise at the memorial site.",
  plc_d8f0d952ab815519b783f5941e3790d7:
    "Route: Start from the Huinnyeoul side and choose only the section toward 75 Plaza that matches your fitness level.\nPhoto spot: Capture the blue railing, rocky coast, and a distant ship together.\nCaution: Check for wet stairs and rockfall notices, and don't go beyond the railing.",
  plc_e099379129c056f8ba1eb3ce7c99237d:
    "Route: Follow the artwork guide from the park entrance for one loop, then continue to Peace Park and the museum.\nPhoto spot: Capture the shapes formed together by the sculptures and tree shadows.\nCaution: Don't climb on or damage the artworks, and keep the memorial atmosphere.",
  plc_e0dae06c87c85b68920deec68c2bbdf1:
    "Route: After entering, check the usage rules, then use the hot spring and sauna areas without overexerting yourself.\nPhoto spot: Where permitted, capture the tidy layout of the common rest area.\nCaution: Photography is banned in the baths and changing areas; use facilities according to your health condition.",
  plc_e503b78fa4f05ead9b2a0dc8af594583:
    "Route: Choose a hiking trail or a vehicle access point matching your fitness level, then head to the summit viewpoint.\nPhoto spot: A scene where the city and Gwangan Bridge lights spread out beyond the beacon mound is a good choice.\nCaution: Avoid the summit in strong wind or heavy fog, and stick to the marked path.",
  plc_e59fbc7557385d90bac781dc7cbc38cf:
    "Route: Take a short walk around the park loop, then spend some time at a viewpoint or rest area.\nPhoto spot: An everyday scene with trees, the walking path, and city buildings overlapping is a good choice.\nCaution: Be considerate of people using the exercise facilities and walking pets.",
  plc_e848ee49dfc85f43923d9e32c171044b:
    "Route: Understand the background at the information hall, then walk quietly through the cemetery, memorial hall, and memorial space in order.\nPhoto spot: Capture the flags and the cemetery's orderly axis from a distance.\nCaution: Avoid eating, loud noise, and casual photography in the cemetery.",
  plc_e92c350f8705521b90acc7afbe59c373:
    "Route: Look around the shop and event space, then enjoy the Gwangalli view from a seat facing the sea.\nPhoto spot: A composition where Gwangan Bridge and the stepped seating appear together beyond the large window is a good choice.\nCaution: Check the photography rules and pet-entry conditions, as they vary by event.",
  plc_ee706dc160f85b66a18debc397f71cb9:
    "Route: Follow the designated loop route from the entrance guidance and tour the signature bamboo forest section.\nPhoto spot: A scene where the path continues through tall, straight bamboo is a good choice.\nCaution: Don't leave the designated path or pick plants, and watch for slippery ground.",
  plc_f182c443a19551a482a3350df4c7eb4c:
    "Route: From the coastal path near Dongbaek Island or Yeonghwa-ui-geori, slowly take in the skyline.\nPhoto spot: A night scene with the water reflection and high-rise buildings stretching vertically is a good choice.\nCaution: Avoid the roadway and private property, and avoid the coastal walk in strong wind.",
  plc_f240a837db8150ea8571a3673c1b32c0:
    "Route: Check the entry rules, then use the hot baths and rest areas slowly according to how you feel.\nPhoto spot: Capture the building's exterior together with the hot-spring district streetscape.\nCaution: Photography is banned in the baths and changing rooms; avoid use after drinking or if feeling unwell.",
  plc_f2fc176194865241972e2f0ab0d63d23:
    "Route: Walk slowly from the access road up to the observatory and take in the views in each direction over the reservoir.\nPhoto spot: From the observatory, capture the reservoir's curved shoreline and the mountain ridge broadly.\nCaution: Watch for slippery surfaces after rain and near the railing, and follow restricted-area rules.",
  plc_f49f2e2e5dec57a9a616344ce3b1ef7b:
    "Route: Walk along the beach, then enjoy the bridge lighting from the sand or a café around dusk.\nPhoto spot: From the center of the sand, capture the whole Gwangan Bridge together with its reflection on the water.\nCaution: Check the swimming area and wave conditions, and follow event control lines.",
  plc_f874dd4109bf5cc1b8f7d5f8bbc9f849:
    "Route: Connect with the stairs section of Ibagu-gil, rest at the viewpoint, then take a short walk through the nearby alleys.\nPhoto spot: A scene where Busan Harbor and rooftops overlap through the viewpoint structure is a good choice.\nCaution: Avoid photographing house windows, and watch for stairs and passing vehicles.",
  plc_fb4d8319e0e55bce8c4b8b8aa8aa3573:
    "Route: Walk the sandy beach, pass the Cloud Trail, then continue to the cable car or the coastal park.\nPhoto spot: Capture the cable car passing over the sea from the beach.\nCaution: Check the swimming area and wave conditions, and don't run on the wet deck.",
  plc_fc0f510b7b185fbfa70b6ce17549c1a2:
    "Route: After entering, check the usage rules, then use the bath, sauna, and rest areas without overexerting yourself.\nPhoto spot: Capture the outside sign together with the surrounding Taejongdae scenery.\nCaution: Photography is banned in the baths and changing areas; follow bathing etiquette and safety rules.",
  plc_fcb85af986795cd195d613183288c4f7:
    "Route: See the exhibition inside the conference hall, then continue to the outdoor deck and the Dongbaek Island coastal path.\nPhoto spot: A spot where Gwangan Bridge and the sea appear together beyond the building's curve is a good choice.\nCaution: Follow the photography guidance for the conference hall exhibits and restricted areas.",
  plc_fe870f5beb4e51799f89aa43f37150ac:
    "Route: From the entrance of Gwangbok-ro, connect toward the Yongdusan Park escalator and BIFF Square.\nPhoto spot: A central composition with the street decorations and Busan Tower together is a good choice.\nCaution: Even on the pedestrian street, watch for delivery vehicles and event installations.",
};

async function main() {
  const client = new MongoClient(mongoUri!);
  await client.connect();
  const placeInfo = client.db("cultural_fit_busan").collection("place_info");

  const writes = Object.entries(GUIDE_TIPS_EN).map(([placeId, guideTipsRawEn]) => ({
    updateOne: { filter: { placeId }, update: { $set: { guideTipsRawEn } } },
  }));

  const result = await placeInfo.bulkWrite(writes);
  console.log(`적재 완료: ${result.matchedCount}건 갱신 (${writes.length}건 중)`);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
