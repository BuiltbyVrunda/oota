import type { Review } from '../types'
import { baseDishes } from './dishes'
import { baseRestaurants } from './restaurants'
import { allSeedUsers, daysAgoIso } from './users'

/** [userId, rating, daysAgo, text, tags ('|'-separated), dish ratings ('Dish:5|Dish:4')] */
type Row = [number, 1 | 2 | 3 | 4 | 5, number, string, string, string]

const byRestaurant: Record<string, Row[]> = {
  'tuppa-and-co': [
    [1, 5, 3, 'The ghee roast dosa is exactly what the name promises: crackling, glossy, and the chutney trio is fresh. Pongal was a little salty but I would come back for the dosa alone.', 'Authentic|Quick', 'Ghee Roast Dosa:5|Pongal:3'],
    [4, 5, 9, 'Best Mysore masala dosa in Jayanagar right now. The red chutney actually has heat. Filter coffee is strong and not too sweet.', 'Value for money|Authentic', 'Mysore Masala Dosa:5|Filter Coffee:5'],
    [8, 4, 14, 'Podi idli is addictive. Benne masala dosa was good but not as buttery as Davanagere. Crowded at 8am on Sundays, expect to stand.', 'Crowded|Value for money', 'Podi Idli:5|Benne Masala Dosa:4'],
    [12, 5, 21, 'Thatte idli is soft as anything, sambar tastes like home. My parents loved it.', 'Family friendly', 'Thatte Idli:5|Medu Vada:4'],
    [17, 3, 30, 'Dosa was great, bisi bele bath was lukewarm and the boondi had gone soft. Service rushed us out.', 'Crowded', 'Bisi Bele Bath:2|Ghee Roast Dosa:4'],
    [20, 5, 45, 'Medu vada are properly crisp. Coffee could be hotter. Still my go-to before work.', 'Quick', 'Medu Vada:4|Filter Coffee:3'],
  ],
  'sanje-darshini': [
    [5, 4, 4, 'Rava idli with the sagu is a proper Malleshwaram breakfast. Kesari bath ran out by 9:40 though.', 'Quick|Value for money', 'Rava Idli:5|Kesari Bath:4'],
    [9, 5, 11, 'Khara bath plus kesari bath (chow chow) for 115 rupees. Unbeatable. Neer dosa was surprisingly good for a darshini.', 'Value for money|Authentic', 'Khara Bath:5|Neer Dosa:4'],
    [13, 3, 19, 'Masala dosa was average, the potato palya lacked salt. Maddur vada was crisp and lovely though.', 'Crowded', 'Masala Dosa:3|Maddur Vada:4'],
    [16, 4, 27, 'Mangalore buns are the reason I come. Badam milk is too sweet for me.', 'Quick', 'Mangalore Buns:5|Badam Milk:3'],
    [22, 4, 38, 'Set dosa is spongy and soaks up the sagu well. Standing tables only, so not for long chats.', 'Quick', 'Set Dosa:4'],
    [7, 5, 52, 'Kesari bath with pineapple and plenty of ghee. Nothing fancy, everything right.', 'Authentic', 'Kesari Bath:5|Rava Idli:4'],
  ],
  'bale-ele-meals': [
    [1, 4, 8, 'Proper wedding-style oota. The Mysore saaru is the highlight, nice and peppery. Wish the palya had more variety.', 'Generous portions|Authentic', 'Bale Ele Oota:4|Mysore Saaru:5'],
    [6, 5, 12, 'Unlimited banana leaf meal and they keep coming back with ghee. Obbattu was soft and warm. Go hungry.', 'Generous portions|Family friendly', 'Bale Ele Oota:5|Obbattu (Holige):5'],
    [10, 4, 20, 'Akki rotti with dill is excellent. Majjige huli was a bit thin.', 'Authentic', 'Akki Rotti:5|Majjige Huli:3'],
    [14, 3, 33, 'Ragi mudde was fine but the soppu saaru was too salty on my visit. Long wait on a Sunday.', 'Crowded', 'Ragi Mudde & Soppu Saaru:3'],
    [19, 5, 47, 'Paal payasa tastes like my grandmother\'s. The mini thali is perfect on weekdays.', 'Value for money', 'Paal Payasa:5|Mini Thali:4'],
    [23, 4, 60, 'Chitranna and kosambari are fresh and bright. Good place to take visitors from out of state.', 'Family friendly', 'Chitranna:4'],
  ],
  'hosa-biryani-mane': [
    [2, 5, 2, 'Mutton donne biryani is the best in Koramangala. Meat falls off the bone, the green masala has real chilli kick. Brinjal gravy is a must.', 'Worth the wait|Generous portions', 'Mutton Donne Biryani:5|Brinjal Gravy:5'],
    [4, 5, 7, 'Chicken donne biryani has that seeraga samba aroma. Chicken kebab is properly red and crisp.', 'Authentic', 'Chicken Donne Biryani:5|Chicken Kebab:4'],
    [11, 4, 15, 'Biryani is great but the mutton pepper fry was too chewy on my visit. Phirni was a nice finish.', 'Crowded', 'Mutton Pepper Fry:3|Phirni:4|Chicken Donne Biryani:5'],
    [15, 4, 24, 'Egg biryani is underrated, and good value. Weekend wait was 35 minutes.', 'Value for money|Worth the wait', 'Egg Biryani:4'],
    [21, 3, 36, 'Veg biryani is just okay, feels like an afterthought. Gobi 65 was good.', '', 'Veg Donne Biryani:2|Gobi 65:4'],
    [18, 5, 50, 'Ordered three mutton biryanis for the office. Everyone went silent. Enough said.', 'Generous portions', 'Mutton Donne Biryani:5'],
    [9, 4, 70, 'Consistent and fast. Chicken kebab could use more curry leaves but the biryani never disappoints.', 'Quick', 'Chicken Kebab:4|Chicken Donne Biryani:4'],
  ],
  'kempu-kitchen': [
    [1, 4, 6, 'The Andhra veg meal is fierce in the best way. Gunpowder ghee rice is dangerously good. Gutti vankaya was too oily though.', 'Authentic|Too spicy', 'Andhra Veg Meals:5|Gunpowder Ghee Rice:5|Gutti Vankaya:3'],
    [5, 5, 10, 'Gongura mutton is the real thing, sour and fiery. Ask for extra ghee with the podi.', 'Authentic', 'Gongura Mutton:5|Andhra Chicken Meals:4'],
    [13, 4, 18, 'Kodi kura made me cry a little. In a good way. Bring a lassi from next door.', 'Too spicy', 'Kodi Kura:4'],
    [17, 5, 25, 'Pesarattu upma is a great lunch, light but filling. Pootharekulu to finish is a nice touch.', 'Value for money', 'Pesarattu Upma:5|Pootharekulu:4'],
    [20, 2, 40, 'Way too spicy for me even after asking for mild. Chilli paneer pulao was a chilli bomb. Staff were friendly though.', 'Too spicy|Great service', 'Chilli Paneer Pulao:2'],
    [8, 4, 55, 'Meals come fast and they refill rasam without asking. Gongura pickle on the cart is excellent.', 'Quick|Generous portions', 'Andhra Veg Meals:4'],
  ],
  'degree-kaapi-co': [
    [1, 5, 2, 'Degree coffee in a brass dabarah, done properly. Ghee podi dosa is a perfect pairing. My favourite morning spot.', 'Work friendly|Cosy', 'Degree Coffee:5|Ghee Podi Dosa:5'],
    [6, 4, 9, 'Iced filter coffee tonic sounds odd but works. Banana bread was a bit dry.', 'Work friendly', 'Iced Filter Coffee Tonic:4|Banana Bread:3'],
    [10, 5, 16, 'Rava kesari cheesecake is genius. Coffee is the best in Indiranagar.', 'Cosy', 'Rava Kesari Cheesecake:5|Degree Coffee:5'],
    [14, 4, 26, 'Idli sambar bowl is comforting. Laptop crowd takes the back room by noon.', 'Work friendly|Crowded', 'Idli Sambar Bowl:4'],
    [21, 3, 39, 'Cappuccino was fine but overpriced next to the filter coffee. Vada pav was cold.', 'Pricey', 'Cappuccino:3|Masala Vada Pav:2'],
    [3, 4, 48, 'Coconut cookie is vegan and crunchy. Nice that they mark vegan items clearly.', 'Cosy', 'Coconut Cookie:4|Iced Filter Coffee Tonic:4'],
  ],
  'nagara-tandoor': [
    [2, 3, 12, 'Butter chicken is good but sweet for my taste and the tandoori chicken was a bit dry. Pricey for what it is.', 'Pricey', 'Butter Chicken:3|Tandoori Chicken:3'],
    [7, 5, 8, 'Dal makhani is the best I have had in Bengaluru, smoky and deep. Garlic naan arrived blistered and hot.', 'Date night|Great service', 'Dal Makhani:5|Garlic Butter Naan:5'],
    [11, 4, 17, 'Rogan josh is properly rich. Laccha paratha is flaky. Service a bit slow on Friday.', 'Date night', 'Rogan Josh:4|Laccha Paratha:5'],
    [15, 5, 23, 'Malai broccoli converted my broccoli-hating husband. Shahi tukda is decadent.', 'Date night|Cosy', 'Malai Broccoli:5|Shahi Tukda:5'],
    [19, 4, 34, 'Butter chicken is excellent, paneer lababdar a little too sweet.', 'Family friendly', 'Butter Chicken:5|Paneer Lababdar:3'],
    [23, 4, 61, 'Great for a big group dinner. Ask for the corner table.', 'Family friendly|Pricey', 'Dal Makhani:4'],
  ],
  'dhaba-number-9': [
    [4, 4, 5, 'Kadai paneer is smoky, with real wok hei. Tandoori roti was perfect. Exactly what Whitefield needed.', 'Generous portions', 'Kadai Paneer:4|Tandoori Roti:4'],
    [8, 3, 13, 'Chole was good but the Amritsari kulcha was doughy inside. Lassi is great.', 'Value for money', 'Amritsari Kulcha:2|Chole:4|Sweet Lassi:5'],
    [12, 4, 22, 'Dhaba chicken curry with roti is a solid post-work dinner. Loud, cheerful place.', 'Loud', 'Dhaba Chicken Curry:4'],
    [16, 4, 31, 'Sarson ka saag with white butter is seasonal and worth it. Paneer tikka was nicely charred.', 'Authentic', 'Sarson Ka Saag:5|Paneer Tikka:4'],
    [22, 3, 44, 'Egg bhurji pav was too oily. Service was slow even when it was empty.', '', 'Egg Bhurji Pav:3'],
    [2, 4, 58, 'Good chicken curry, generous portions. Not fine dining, does not pretend to be.', 'Generous portions', 'Dhaba Chicken Curry:4|Paneer Tikka:4'],
  ],
  'kebab-kothi': [
    [2, 5, 1.5, 'Seekh kebab is the best on Mosque Road and that is saying something. Smoked chicken tikka is juicy with real charcoal flavour.', 'Worth the wait|Authentic', 'Mutton Seekh Kebab:5|Smoked Chicken Tikka:5'],
    [5, 5, 7, 'Galouti melts. Sheermal with nihari on a Friday is a religious experience.', 'Worth the wait', 'Galouti Kebab:5|Nihari:5|Sheermal:4'],
    [9, 5, 14, 'Boti kebab was smoky and tender. Biryani is decent, not their strength.', 'Crowded', 'Boti Kebab:5|Chicken Biryani (Dum):3'],
    [11, 5, 22, 'Came during Ramzan, worth the chaos. Kaddu ki kheer is lovely and not too sweet.', 'Crowded|Authentic', 'Kaddu Ki Kheer:4|Mutton Seekh Kebab:5'],
    [18, 3, 35, 'Hara bhara kebab was bland and the vegetarian options are limited. Meat eaters will love it.', '', 'Hara Bhara Kebab:2'],
    [15, 5, 49, 'Opens only at 4 but worth planning around. Parking is a nightmare.', 'Crowded', 'Smoked Chicken Tikka:4'],
    [21, 5, 66, 'Nihari is rich, sticky and slow. Bring friends, order everything.', 'Generous portions', 'Nihari:5|Boti Kebab:4'],
  ],
  'mangala-coast': [
    [6, 5, 4, 'Kori rotti is exactly like in Mangaluru. Prawn ghee roast is fiery and glossy.', 'Authentic', 'Kori Rotti:5|Prawn Ghee Roast:5'],
    [10, 4, 11, 'Fish gassi with neer dosa is comforting. Pomfret was a little overfried.', 'Family friendly', 'Fish Gassi & Neer Dosa:5|Rava Fried Pomfret:3'],
    [14, 4, 20, 'Mushroom ghee roast for the vegetarians is a smart touch, really good. Sol kadhi is refreshing.', 'Great service', 'Mushroom Ghee Roast:4|Sol Kadhi:5'],
    [17, 5, 29, 'Squid sukka with kudampuli is perfect. Elaneer payasam to end. Will be back.', 'Date night', 'Squid Sukka:5|Elaneer Payasam:5'],
    [20, 3, 42, 'Prices have gone up a lot. Prawn ghee roast portion was small for 560.', 'Pricey', 'Prawn Ghee Roast:3'],
    [12, 4, 57, 'Kadle manoli is a nice vegan side. Calm place for a weekday lunch.', 'Cosy', 'Kadle Manoli:4'],
  ],
  'forno-verde': [
    [3, 5, 1.2, 'Finally a vegan margherita where the cashew mozzarella actually melts. The vegan tiramisu is creamy and not cloying. Instant favourite.', 'Date night|Great service', 'Vegan Margherita:5|Vegan Tiramisu:5'],
    [1, 2, 18, 'Margherita was fine, but nothing on the menu has any spice and it is expensive for what you get. Not for me.', 'Pricey', 'Margherita DOP:3|Arancini:2'],
    [7, 5, 6, 'Cacio e pepe is textbook. Dough on the pizza is leopard-spotted and chewy.', 'Date night', 'Cacio e Pepe:5|Margherita DOP:5'],
    [13, 4, 15, 'Burrata is fresh, diavola had a nice chilli honey kick. Weekend wait was long.', 'Worth the wait|Pricey', 'Burrata & Heirloom Tomato:4|Diavola:4'],
    [16, 5, 28, 'Pesto genovese vegan is bright and fresh. Truffle funghi pizza for the non-vegans was a hit too.', 'Great service', 'Pesto Genovese (Vegan):5|Funghi e Tartufo:5'],
    [22, 4, 40, 'Great pizza, small portions of pasta. Ask for the window seat to watch them roll it.', 'Date night', 'Cacio e Pepe:4|Diavola:4'],
  ],
  'trattoria-ulsoor': [
    [5, 5, 5, 'Tiramisu della casa deserves its reputation. Carbonara is the real thing, no cream.', 'Date night|Cosy', 'Tiramisu della Casa:5|Carbonara:5'],
    [9, 4, 13, 'Pumpkin ravioli with sage butter is lovely. Bruschetta trio was good, not great.', 'Cosy', 'Pumpkin Ravioli:5|Bruschetta Trio:3'],
    [3, 3, 24, 'Spaghetti pomodoro is vegan and simple, but they had nothing vegan for dessert. Pretty lakeside setting.', 'Cosy|Pricey', 'Spaghetti Pomodoro:4'],
    [19, 4, 33, 'Lasagne is rich and generous. Service attentive but slow.', 'Generous portions', 'Lasagne al Forno:4|Quattro Formaggi:4'],
    [23, 3, 46, 'Minestrone was watery. Panna cotta with jamun compote is a fun twist.', 'Pricey', 'Minestrone:2|Panna Cotta:4'],
    [12, 4, 63, 'Romantic outdoor seating, a good tiramisu, a slightly salty carbonara.', 'Date night', 'Tiramisu della Casa:5|Carbonara:3'],
  ],
  'slow-roast-and-crumb': [
    [8, 5, 3, 'The cardamom bun is worth the queue. Croissant is honeycombed and buttery. Pour-over had a lovely jaggery note.', 'Worth the wait|Cosy', 'Cardamom Bun:5|Butter Croissant:5|Pour-over (Chikmagalur):5'],
    [11, 4, 9, 'Flat white is consistent. Almond croissant a bit too sweet for me.', 'Work friendly', 'Flat White:4|Almond Croissant:3'],
    [14, 5, 16, 'Eggs on sourdough are silky. Best brunch in 7th block.', 'Cosy', 'Eggs on Sourdough:5'],
    [3, 4, 22, 'Pour-over is excellent and black coffee is vegan, but almost all the bakes have butter or egg. Wish there were vegan pastries.', 'Cosy', 'Pour-over (Chikmagalur):5'],
    [18, 4, 37, 'Lemon tart is properly sharp. Mushroom toast is generous.', 'Generous portions', 'Lemon Tart:5|Mushroom Toast:4'],
    [21, 3, 52, 'Iced mocha was too sweet and the place is loud at noon. Bakes are great though.', 'Loud|Crowded', 'Iced Mocha:2|Butter Croissant:4'],
  ],
  'bean-atlas': [
    [3, 3, 2, 'Avocado toast was fine but underseasoned. The cold brew tonic was the best thing I had. Lovely plants, slow service.', 'Cosy|Work friendly', 'Avocado Toast:3|Cold Brew Tonic:5'],
    [6, 5, 8, 'Big brunch plate on a Sunday, perfect hangover cure. Iced filter coffee is a great idea.', 'Generous portions', 'Big Brunch Plate:5|Iced Filter Coffee:5'],
    [15, 4, 14, 'Shakshuka is well spiced, pita a bit cold. Nice place to work from.', 'Work friendly', 'Shakshuka:4'],
    [20, 4, 27, 'Açaí bowl is fresh and not too sweet. Banoffee jar is dessert heaven.', 'Cosy', 'Açaí Smoothie Bowl:4|Banoffee Jar:5'],
    [10, 3, 41, 'Chicken pesto sandwich was dry. Coffee saves it.', '', 'Chicken Pesto Sandwich:2|Iced Filter Coffee:4'],
    [16, 4, 56, 'Grilled veg pasta was light and good. Quiet on weekdays.', 'Work friendly', 'Grilled Veg Pasta:4'],
  ],
  'momo-mandala': [
    [2, 2, 9, 'Momos were okay but the chicken filling was bland and the place is tiny. Not worth the hype for me.', 'Crowded', 'Chicken Steamed Momos:2'],
    [5, 5, 4, 'Jhol momos are incredible, the sesame-tomato broth is addictive. Sepen sauce is lethal.', 'Value for money|Authentic', 'Jhol Momos:5|Chicken Steamed Momos:4'],
    [9, 5, 10, 'Thukpa on a rainy evening. Perfect. Pan-fried paneer momos are crisp and creamy.', 'Cosy|Value for money', 'Chicken Thukpa:5|Pan-Fried Paneer Momos:5'],
    [13, 4, 18, 'Veg momos are fresh with lots of ginger. Chilli potato is great with a beer.', 'Value for money', 'Veg Steamed Momos:4|Chilli Potato:5'],
    [17, 5, 30, 'Shapale is crisp and juicy. Butter tea is an acquired taste but I acquired it.', 'Authentic', 'Shapale:5|Butter Tea:4'],
    [22, 4, 44, 'Thenthuk is hearty and vegan. Small place, expect to share a table.', 'Crowded', 'Veg Thenthuk:4'],
    [7, 4, 59, 'Consistently good momos for under 200. Jhol is the move.', 'Value for money', 'Jhol Momos:5'],
  ],
  'ginza-noodle-bar': [
    [4, 5, 5, 'Tonkotsu broth is milky and deep, the egg is jammy. Best ramen in the city.', 'Worth the wait', 'Tonkotsu Ramen:5|Gyoza (Chicken):4'],
    [3, 4, 11, 'White miso vegan ramen is creamy and comforting, a rare good vegan ramen. A bit salty.', 'Cosy', 'White Miso Vegan Ramen:4|Vegetable Gyoza:4'],
    [10, 4, 19, 'Tantanmen is spicy and nutty. Karaage was crisp but small.', 'Pricey', 'Tantanmen:5|Karaage:3'],
    [14, 3, 28, 'Shoyu ramen was underwhelming, broth too light. Counter seating is cramped.', 'Crowded|Pricey', 'Shoyu Chicken Ramen:2'],
    [18, 5, 39, 'Agedashi tofu is delicate and lovely. Matcha mochi to finish.', 'Date night', 'Agedashi Tofu:5|Matcha Mochi:4'],
    [23, 4, 54, 'Great ramen, slow service when full. Go before 7.', 'Crowded', 'Tonkotsu Ramen:4'],
  ],
  'bao-and-basil': [
    [6, 4, 6, 'Pork belly bao is sticky and rich. Kung pao has real Sichuan tingle.', 'Date night', 'Pork Belly Bao:5|Kung Pao Chicken:4'],
    [11, 4, 13, 'Thai green curry (veg) is fresh and fragrant. Lychee iced tea is great.', 'Family friendly', 'Thai Green Curry (Veg):4|Lychee Iced Tea:4'],
    [16, 3, 21, 'Dan dan noodles were oily. Crispy tofu bao was good.', 'Pricey', 'Dan Dan Noodles:2|Crispy Tofu Bao:4'],
    [3, 4, 32, 'Plenty of vegan options, clearly marked. Sushi bowl was fresh but a bit plain.', 'Great service', 'Sushi Bowl (Veg):3|Thai Green Curry (Veg):5'],
    [19, 4, 45, 'Basil fried rice is a solid weekday lunch. Whitefield needed this.', 'Quick', 'Basil Fried Rice:4'],
    [12, 3, 60, 'Red curry was too sweet for me. Nice interiors.', '', 'Thai Red Curry (Chicken):3'],
  ],
  'smash-yard': [
    [2, 4, 3, 'Double smash has those crispy lace edges. Fries are excellent. Shake was too sweet.', 'Loud|Generous portions', 'Double Smash Burger:4|Double-Fried Fries:5|Salted Caramel Shake:3'],
    [4, 5, 7, 'Nashville hot chicken burger is properly hot and crunchy. Best burger in Koramangala.', 'Loud', 'Nashville Hot Chicken:5'],
    [8, 5, 12, 'BBQ bacon burger with onion rings is outrageous. Loud music, great vibe.', 'Loud', 'Smoky BBQ Bacon Burger:5|Double-Fried Fries:4'],
    [13, 4, 20, 'Crispy paneer burger is legit, not a sad veg option. Buffalo wings are tangy.', 'Value for money', 'Crispy Paneer Burger:4|Buffalo Wings:4'],
    [3, 4, 26, 'Beyond smash is a great vegan burger, the bun is vegan too. Fries are vegan. Loud though.', 'Loud', 'Beyond Smash (Vegan):4|Double-Fried Fries:5'],
    [20, 4, 38, 'Loaded cheese fries are a meal. Late-night open is a blessing.', 'Generous portions', 'Loaded Cheese Fries:4'],
    [17, 5, 52, 'Smash burger every Friday. Never miss.', 'Quick', 'Double Smash Burger:5'],
  ],
  'patty-and-pickle': [
    [5, 4, 7, 'Gongura chicken burger is a brilliant idea, tangy and spicy. Mango thokku fries too.', 'Value for money', 'Gongura Chicken Burger:5|Mango Thokku Fries:4'],
    [9, 3, 15, 'Classic cheeseburger was overcooked. Paneer tikka burger is the better choice.', '', 'Classic Cheeseburger:2|Paneer Tikka Burger:4'],
    [12, 4, 24, 'Filter coffee shake is genius. Aloo tikki burger is a good cheap lunch.', 'Value for money|Quick', 'Filter Coffee Shake:5|Aloo Tikki Burger:4'],
    [15, 3, 33, 'Chicken popcorn was soggy by the time it arrived. Rose falooda shake was nice.', '', 'Chicken Popcorn:2|Rose Falooda Shake:4'],
    [21, 4, 47, 'Masala onion rings are a great snack. Fun menu.', 'Quick', 'Masala Onion Rings:4'],
    [23, 4, 62, 'Good, cheap, creative. Not life-changing.', 'Value for money', 'Paneer Tikka Burger:4'],
  ],
  'chaat-gully': [
    [1, 5, 10, 'Masala puri like the old Gandhi Bazaar carts, hot peas gravy and loads of sev. Mirchi bajji is properly spicy.', 'Authentic|Value for money', 'Masala Puri:5|Mirchi Bajji:5'],
    [7, 5, 6, 'Pani puri water has a real kick. Samosa chaat is huge.', 'Value for money|Crowded', 'Pani Puri:4|Samosa Chaat:4'],
    [11, 5, 14, 'Dahi puri balanced perfectly between sweet and tangy. Cheap and brilliant.', 'Value for money', 'Dahi Puri:5|Bhel Puri:4'],
    [14, 4, 23, 'Samosas fried in front of you. Kulfi falooda to cool down.', 'Quick', 'Punjabi Samosa:4|Kulfi Falooda:4'],
    [18, 3, 35, 'Pav bhaji had too much butter even for me, and it is chaotic at 7pm.', 'Crowded', 'Pav Bhaji:3'],
    [22, 4, 48, 'Best evening snack stop in Basavanagudi. Hygiene is better than the carts.', 'Family friendly', 'Masala Puri:4'],
  ],
  'appe-adda': [
    [1, 4, 4, 'Cheese chilli paddu is fun and actually spicy. The green chutney is so good I bought the jar.', 'Value for money', 'Cheese Chilli Paddu:4|Green Chutney Jar:5'],
    [10, 4, 12, 'Ragi paddu is crisp and healthy-ish. Idli vada combo is standard.', 'Quick', 'Ragi Paddu:5|Idli Vada Combo:3'],
    [16, 3, 20, 'Plain paddu was a bit dense. Open butter masala dosa was great though.', '', 'Plain Paddu:3|Open Butter Masala Dosa:4'],
    [19, 4, 31, 'Sweet banana appe is a lovely end. Kids love this place.', 'Family friendly', 'Sweet Banana Appe:5'],
    [23, 3, 45, 'Lemon sevai was dry and the masala paddu came cold. Chutney is still top.', '', 'Lemon Sevai:2|Masala Paddu:3'],
    [6, 4, 58, 'Paddu with chutney and coffee is a perfect cheap breakfast.', 'Value for money', 'Plain Paddu:4'],
  ],
  'saaru-and-sons': [
    [4, 5, 5, 'Three saarus on one thali. Pepper rasam clears the sinuses. Naati koli saaru on Sunday is outstanding.', 'Authentic|Generous portions', 'Saaru Oota Thali:5|Naati Koli Saaru:5|Pepper Rasam:5'],
    [8, 4, 13, 'Andhra thali is hot and generous. Ulavacharu is smoky and unusual.', 'Generous portions', 'Andhra Thali:4|Ulavacharu:5'],
    [12, 4, 22, 'Bassaru with ragi mudde is real home food. Curd rice with pomegranate is a nice touch.', 'Authentic', 'Bassaru:4|Curd Rice:4'],
    [17, 3, 34, 'Mutton chops were tough. Kayi holige was good.', '', 'Mutton Chops:2|Kayi Holige:4'],
    [20, 4, 46, 'Simple, honest thali. Service is quick and kind.', 'Great service|Quick', 'Saaru Oota Thali:4'],
    [9, 4, 61, 'Pepper rasam in a glass is a great idea. Rajajinagar regulars know.', 'Authentic', 'Pepper Rasam:4'],
  ],
  'sweet-shed': [
    [3, 4, 3, 'Vegan chocolate torte is rich and fudgy, and the vegan mango panna cotta is fresh. Wish there were more vegan cupcakes.', 'Cosy', 'Vegan Chocolate Torte:5|Mango Panna Cotta (Vegan):4|Vegan Coconut Cupcake:3'],
    [7, 5, 9, 'Jaggery coconut cheesecake is unique and delicious. Tres leches soaked perfectly.', 'Cosy', 'Jaggery Coconut Cheesecake:5|Tres Leches:5'],
    [11, 4, 17, 'Red velvet cupcake is moist. Hot chocolate is thick.', 'Family friendly', 'Red Velvet Cupcake:4|Hot Chocolate:4'],
    [15, 4, 28, 'Eggless chocolate cupcake is the best eggless cake I have had.', 'Value for money', 'Eggless Chocolate Cupcake:5'],
    [19, 3, 40, 'Gulab jamun cheesecake jar was too sweet. Nice idea though.', '', 'Gulab Jamun Cheesecake Jar:2'],
    [22, 4, 55, 'Great dessert stop after dinner in Whitefield.', 'Cosy', 'Tres Leches:4'],
  ],
  'greenhouse-5': [
    [3, 5, 0.5, 'Tofu scramble that actually tastes of something. Vegan mushroom risotto is creamy without any dairy. The glasshouse in morning light is gorgeous.', 'Cosy|Work friendly', 'Tofu Scramble:5|Vegan Mushroom Risotto:5'],
    [6, 4, 8, 'Buddha bowl is fresh and filling. Pricey for a bowl.', 'Pricey', 'Buddha Bowl:4|Cold-Pressed Green Juice:4'],
    [10, 5, 15, 'Vegan berry cheesecake fooled my non-vegan friend. Oat latte is good.', 'Cosy', 'Vegan Berry Cheesecake:5|Oat Milk Latte:4'],
    [13, 5, 24, 'Eggs Benedict for the non-vegans is excellent too. Lovely light.', 'Date night', 'Eggs Benedict:4'],
    [18, 3, 36, 'Vegan pesto pizza base was soggy. Service was slow.', 'Pricey', 'Vegan Pesto Pizza:2|Grilled Chicken Salad:4'],
    [21, 5, 50, 'My go-to for clean, tasty food. Green juice every Saturday.', 'Work friendly', 'Cold-Pressed Green Juice:5|Buddha Bowl:5'],
  ],
}

const restaurantBySlug = new Map(baseRestaurants.map((r) => [r.slug, r]))
const userName = new Map(allSeedUsers.map((u) => [u.id, u.fullName]))

export function buildSeedReviews(now = Date.now()): Review[] {
  const out: Review[] = []
  for (const [slug, rows] of Object.entries(byRestaurant)) {
    const r = restaurantBySlug.get(slug)
    if (!r) throw new Error(`Unknown restaurant ${slug}`)
    const menu = baseDishes.filter((d) => d.restaurantId === r.id)
    rows.forEach(([userId, rating, daysAgo, text, tags, dishes], i) => {
      const dishRatings = dishes
        .split('|')
        .filter(Boolean)
        .map((pair) => {
          const idx = pair.lastIndexOf(':')
          const name = pair.slice(0, idx)
          const dish = menu.find((d) => d.name === name)
          if (!dish) throw new Error(`Review for ${slug} names unknown dish "${name}"`)
          return { dishId: dish.id, rating: Number(pair.slice(idx + 1)) as 1 | 2 | 3 | 4 | 5 }
        })
      out.push({
        id: `seed-${r.id}-${i + 1}`,
        restaurantId: r.id,
        userId,
        userName: userName.get(userId) ?? 'Diner',
        rating,
        text,
        tags: tags.split('|').filter(Boolean),
        dishRatings,
        createdAt: daysAgoIso(daysAgo, now),
      })
    })
  }
  return out
}
