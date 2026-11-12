// src/lib/bd-locations.ts
// Comprehensive dataset of all 64 districts and thanas/upazilas in Bangladesh for Steadfast & Courier Auto-Fill

export interface BdAreaItem {
  id: string;
  thana: string;
  thanaBn: string;
  district: string;
  districtBn: string;
  division: string;
  label: string;
  searchKeywords: string[];
}

export const BD_DISTRICTS_DATA: Array<{
  district: string;
  districtBn: string;
  division: string;
  thanas: Array<{ name: string; nameBn: string }>;
}> = [
  // ==================== DHAKA DIVISION ====================
  {
    district: "Dhaka",
    districtBn: "ঢাকা",
    division: "Dhaka",
    thanas: [
      { name: "Dhanmondi", nameBn: "ধানমন্ডি" },
      { name: "Gulshan", nameBn: "গুলশান" },
      { name: "Banani", nameBn: "বনানী" },
      { name: "Mirpur", nameBn: "মিরপুর" },
      { name: "Uttara", nameBn: "উত্তরা" },
      { name: "Mohammadpur", nameBn: "মোহাম্মদপুর" },
      { name: "Badda", nameBn: "বাড্ডা" },
      { name: "Motijheel", nameBn: "মতিঝিল" },
      { name: "Tejgaon", nameBn: "তেজগাঁও" },
      { name: "Tejgaon Industrial Area", nameBn: "তেজগাঁও শিল্পাঞ্চল" },
      { name: "Khilgaon", nameBn: "খিলগাঁও" },
      { name: "Jatrabari", nameBn: "যাত্রাবাড়ী" },
      { name: "Rampura", nameBn: "রামপুরা" },
      { name: "Lalbagh", nameBn: "লালবাগ" },
      { name: "Shahbagh", nameBn: "শাহবাগ" },
      { name: "Paltan", nameBn: "পল্টন" },
      { name: "Ramna", nameBn: "রমনা" },
      { name: "New Market", nameBn: "নিউ মার্কেট" },
      { name: "Kotwali", nameBn: "কোতোয়ালী" },
      { name: "Sutrapur", nameBn: "সূত্রাপুর" },
      { name: "Hazaribagh", nameBn: "হাজারীবাগ" },
      { name: "Kamrangirchar", nameBn: "কামরাঙ্গীরচর" },
      { name: "Demra", nameBn: "ডেমরা" },
      { name: "Sabujbagh", nameBn: "সবুজবাগ" },
      { name: "Kadamtali", nameBn: "কদমতলী" },
      { name: "Kafrul", nameBn: "কাফরুল" },
      { name: "Cantonment", nameBn: "ক্যান্টনমেন্ট" },
      { name: "Bhatara", nameBn: "ভাটারা" },
      { name: "Khilkhet", nameBn: "খিলক্ষেত" },
      { name: "Dakshinkhan", nameBn: "দক্ষিণখান" },
      { name: "Uttarkhan", nameBn: "উত্তরখান" },
      { name: "Turag", nameBn: "তুরাগ" },
      { name: "Biman Bandar", nameBn: "বিমানবন্দর" },
      { name: "Adabor", nameBn: "আদাবর" },
      { name: "Sher-e-Bangla Nagar", nameBn: "শেরেবাংলা নগর" },
      { name: "Shyampur", nameBn: "শ্যামপুর" },
      { name: "Bangshal", nameBn: "বংশাল" },
      { name: "Chawkbazar", nameBn: "চকবাজার" },
      { name: "Wari", nameBn: "ওয়ারী" },
      { name: "Gendaria", nameBn: "গেন্ডারিয়া" },
      { name: "Mugda", nameBn: "মুগদা" },
      { name: "Rupnagar", nameBn: "রূপনগর" },
      { name: "Bhasantek", nameBn: "ভাষানটেক" },
      { name: "Kalabagan", nameBn: "কলাবাগান" },
      { name: "Hatirjheel", nameBn: "হাতিরঝিল" },
      { name: "Savar", nameBn: "সাভার" },
      { name: "Ashulia", nameBn: "আশুলিয়া" },
      { name: "Keraniganj", nameBn: "কেরানীগঞ্জ" },
      { name: "Dhamrai", nameBn: "ধামরাই" },
      { name: "Dohar", nameBn: "দোহার" },
      { name: "Nawabganj", nameBn: "নবাবগঞ্জ" },
    ],
  },
  {
    district: "Gazipur",
    districtBn: "গাজীপুর",
    division: "Dhaka",
    thanas: [
      { name: "Gazipur Sadar", nameBn: "গাজীপুর সদর" },
      { name: "Joydebpur", nameBn: "জয়দেবপুর" },
      { name: "Tongi", nameBn: "টঙ্গী" },
      { name: "Kaliakair", nameBn: "কালিয়াকৈর" },
      { name: "Sreepur", nameBn: "শ্রীপুর" },
      { name: "Kapasia", nameBn: "কাপাসিয়া" },
      { name: "Kaliganj", nameBn: "কালীগঞ্জ" },
    ],
  },
  {
    district: "Narayanganj",
    districtBn: "নারায়ণগঞ্জ",
    division: "Dhaka",
    thanas: [
      { name: "Narayanganj Sadar", nameBn: "নারায়ণগঞ্জ সদর" },
      { name: "Fatullah", nameBn: "ফতুল্লা" },
      { name: "Siddhirganj", nameBn: "সিদ্ধিরগঞ্জ" },
      { name: "Bandar", nameBn: "বন্দর" },
      { name: "Rupganj", nameBn: "রূপগঞ্জ" },
      { name: "Araihazar", nameBn: "আড়াইহাজার" },
      { name: "Sonargaon", nameBn: "সোনারগাঁও" },
    ],
  },
  {
    district: "Tangail",
    districtBn: "টাঙ্গাইল",
    division: "Dhaka",
    thanas: [
      { name: "Tangail Sadar", nameBn: "টাঙ্গাইল সদর" },
      { name: "Gopalpur", nameBn: "গোপালপুর" },
      { name: "Basail", nameBn: "বাসাইল" },
      { name: "Bhuapur", nameBn: "ভূঞাপুর" },
      { name: "Delduar", nameBn: "দেলদুয়ার" },
      { name: "Ghatail", nameBn: "ঘাটাইল" },
      { name: "Kalihati", nameBn: "কালিহাতী" },
      { name: "Madhupur", nameBn: "মধুপুর" },
      { name: "Mirzapur", nameBn: "মির্জাপুর" },
      { name: "Nagarpur", nameBn: "নাগরপুর" },
      { name: "Sakhipur", nameBn: "সখিপুর" },
      { name: "Dhanbari", nameBn: "ধনবাড়ী" },
    ],
  },
  {
    district: "Kishoreganj",
    districtBn: "কিশোরগঞ্জ",
    division: "Dhaka",
    thanas: [
      { name: "Kishoreganj Sadar", nameBn: "কিশোরগঞ্জ সদর" },
      { name: "Bhairab", nameBn: "ভৈরব" },
      { name: "Bajitpur", nameBn: "বাজিতপুর" },
      { name: "Hossainpur", nameBn: "হোসেনপুর" },
      { name: "Itna", nameBn: "ইটনা" },
      { name: "Karimganj", nameBn: "করিমগঞ্জ" },
      { name: "Katiadi", nameBn: "কটিয়াদী" },
      { name: "Kuliarchar", nameBn: "কুলিয়ারচর" },
      { name: "Mithamain", nameBn: "মিঠামইন" },
      { name: "Nikli", nameBn: "নিকলী" },
      { name: "Pakundia", nameBn: "পাকুন্দিয়া" },
      { name: "Tarail", nameBn: "তাড়াইল" },
      { name: "Austagram", nameBn: "অষ্টগ্রাম" },
    ],
  },
  {
    district: "Narsingdi",
    districtBn: "নরসিংদী",
    division: "Dhaka",
    thanas: [
      { name: "Narsingdi Sadar", nameBn: "নরসিংদী সদর" },
      { name: "Belabo", nameBn: "বেলাবো" },
      { name: "Monohardi", nameBn: "মনোহরদী" },
      { name: "Palash", nameBn: "পলাশ" },
      { name: "Raipura", nameBn: "রায়পুরা" },
      { name: "Shibpur", nameBn: "শিবপুর" },
    ],
  },
  {
    district: "Manikganj",
    districtBn: "মানিকগঞ্জ",
    division: "Dhaka",
    thanas: [
      { name: "Manikganj Sadar", nameBn: "মানিকগঞ্জ সদর" },
      { name: "Singair", nameBn: "সিংগাইর" },
      { name: "Shibalaya", nameBn: "শিবালয়" },
      { name: "Saturia", nameBn: "সাটুরিয়া" },
      { name: "Harirampur", nameBn: "হরিরামপুর" },
      { name: "Ghior", nameBn: "ঘিওর" },
      { name: "Daulatpur", nameBn: "দৌলতপুর" },
    ],
  },
  {
    district: "Munshiganj",
    districtBn: "মুন্সীগঞ্জ",
    division: "Dhaka",
    thanas: [
      { name: "Munshiganj Sadar", nameBn: "মুন্সীগঞ্জ সদর" },
      { name: "Sreenagar", nameBn: "শ্রীনগর" },
      { name: "Sirajdikhan", nameBn: "সিরাজদিখান" },
      { name: "Louhajang", nameBn: "লৌহজং" },
      { name: "Tongibari", nameBn: "টঙ্গিবাড়ী" },
      { name: "Gazaria", nameBn: "গজারিয়া" },
    ],
  },
  {
    district: "Faridpur",
    districtBn: "ফরিদপুর",
    division: "Dhaka",
    thanas: [
      { name: "Faridpur Sadar", nameBn: "ফরিদপুর সদর" },
      { name: "Boalmari", nameBn: "বোয়ালমারী" },
      { name: "Alfadanga", nameBn: "আলফাডাঙ্গা" },
      { name: "Madhukhali", nameBn: "মধুখালী" },
      { name: "Bhanga", nameBn: "ভাঙ্গা" },
      { name: "Nagarkanda", nameBn: "নগরকান্দা" },
      { name: "Charbhadrasan", nameBn: "চরভদ্রাসন" },
      { name: "Sadarpur", nameBn: "সদরপুর" },
      { name: "Saltha", nameBn: "সালথা" },
    ],
  },
  {
    district: "Gopalganj",
    districtBn: "গোপালগঞ্জ",
    division: "Dhaka",
    thanas: [
      { name: "Gopalganj Sadar", nameBn: "গোপালগঞ্জ সদর" },
      { name: "Kashiani", nameBn: "কাশিয়ানী" },
      { name: "Kotalipara", nameBn: "কোটালীপাড়া" },
      { name: "Muksudpur", nameBn: "মুকসুদপুর" },
      { name: "Tungipara", nameBn: "টুঙ্গিপাড়া" },
    ],
  },
  {
    district: "Madaripur",
    districtBn: "মাদারীপুর",
    division: "Dhaka",
    thanas: [
      { name: "Madaripur Sadar", nameBn: "মাদারীপুর সদর" },
      { name: "Shibchar", nameBn: "শিবচর" },
      { name: "Kalkini", nameBn: "কালকিনি" },
      { name: "Rajoir", nameBn: "রাজৈর" },
      { name: "Dasar", nameBn: "ডাসার" },
    ],
  },
  {
    district: "Rajbari",
    districtBn: "রাজবাড়ী",
    division: "Dhaka",
    thanas: [
      { name: "Rajbari Sadar", nameBn: "রাজবাড়ী সদর" },
      { name: "Goalanda", nameBn: "গোয়ালন্দ" },
      { name: "Pangsha", nameBn: "পাংশা" },
      { name: "Baliakandi", nameBn: "বালিয়াকান্দি" },
      { name: "Kalukhali", nameBn: "কালুখালী" },
    ],
  },
  {
    district: "Shariatpur",
    districtBn: "শরীয়তপুর",
    division: "Dhaka",
    thanas: [
      { name: "Shariatpur Sadar", nameBn: "শরীয়তপুর সদর" },
      { name: "Damudya", nameBn: "ডামুড্যা" },
      { name: "Naria", nameBn: "নড়িয়া" },
      { name: "Jajira", nameBn: "জাজিরা" },
      { name: "Bhedarganj", nameBn: "ভেদরগঞ্জ" },
      { name: "Gosairhat", nameBn: "গোসাইরহাট" },
    ],
  },

  // ==================== KHULNA DIVISION ====================
  {
    district: "Jhenaidah",
    districtBn: "ঝিনাইদহ",
    division: "Khulna",
    thanas: [
      { name: "Jhenaidah Sadar", nameBn: "ঝিনাইদহ সদর" },
      { name: "Kaliganj", nameBn: "কালীগঞ্জ" },
      { name: "Kotchandpur", nameBn: "কোটচাঁদপুর" },
      { name: "Maheshpur", nameBn: "মহেশপুর" },
      { name: "Shailkupa", nameBn: "শৈলকুপা" },
      { name: "Harinakunda", nameBn: "হরিণাকুণ্ডু" },
    ],
  },
  {
    district: "Khulna",
    districtBn: "খুলনা",
    division: "Khulna",
    thanas: [
      { name: "Khulna Sadar", nameBn: "খুলনা সদর" },
      { name: "Sonadanga", nameBn: "সোনাডাঙ্গা" },
      { name: "Khalishpur", nameBn: "খালিশপুর" },
      { name: "Daulatpur", nameBn: "দৌলতপুর" },
      { name: "Khan Jahan Ali", nameBn: "খান জাহান আলী" },
      { name: "Harintana", nameBn: "হরিণটানা" },
      { name: "Aranghata", nameBn: "আড়ংঘাটা" },
      { name: "Batiaghata", nameBn: "বটিয়াঘাটা" },
      { name: "Dacope", nameBn: "দাকোপ" },
      { name: "Dumuria", nameBn: "ডুমুরিয়া" },
      { name: "Dighalia", nameBn: "দিঘলিয়া" },
      { name: "Koyra", nameBn: "কয়রা" },
      { name: "Paikgachha", nameBn: "পাইকগাছা" },
      { name: "Phultala", nameBn: "ফুলতলা" },
      { name: "Rupsha", nameBn: "রূপসা" },
      { name: "Terokhada", nameBn: "তেরখাদা" },
    ],
  },
  {
    district: "Jashore",
    districtBn: "যশোর",
    division: "Khulna",
    thanas: [
      { name: "Jashore Sadar", nameBn: "যশোর সদর" },
      { name: "Abhaynagar", nameBn: "অভয়নগর" },
      { name: "Bagherpara", nameBn: "বাঘারপাড়া" },
      { name: "Chaugachha", nameBn: "চৌগাছা" },
      { name: "Jhikargachha", nameBn: "ঝিকরগাছা" },
      { name: "Keshabpur", nameBn: "কেশবপুর" },
      { name: "Manirampur", nameBn: "মণিরামপুর" },
      { name: "Sharsha", nameBn: "শার্শা" },
      { name: "Benapole", nameBn: "বেনাপোল" },
    ],
  },
  {
    district: "Kushtia",
    districtBn: "কুষ্টিয়া",
    division: "Khulna",
    thanas: [
      { name: "Kushtia Sadar", nameBn: "কুষ্টিয়া সদর" },
      { name: "Kumarkhali", nameBn: "কুমারখালী" },
      { name: "Daulatpur", nameBn: "দৌলতপুর" },
      { name: "Bheramara", nameBn: "ভেড়ামারা" },
      { name: "Mirpur", nameBn: "মিরপুর" },
      { name: "Khoksa", nameBn: "খোকসা" },
    ],
  },
  {
    district: "Satkhira",
    districtBn: "সাতক্ষীরা",
    division: "Khulna",
    thanas: [
      { name: "Satkhira Sadar", nameBn: "সাতক্ষীরা সদর" },
      { name: "Assasuni", nameBn: "আশাশুনি" },
      { name: "Debhata", nameBn: "দেবহাটা" },
      { name: "Kalaroa", nameBn: "কলারোয়া" },
      { name: "Kaliganj", nameBn: "কালীগঞ্জ" },
      { name: "Shyamnagar", nameBn: "শ্যামনগর" },
      { name: "Tala", nameBn: "তালা" },
    ],
  },
  {
    district: "Bagerhat",
    districtBn: "বাগেরহাট",
    division: "Khulna",
    thanas: [
      { name: "Bagerhat Sadar", nameBn: "বাগেরহাট সদর" },
      { name: "Chitalmari", nameBn: "চিতলমারী" },
      { name: "Fakirhat", nameBn: "ফকিরহাট" },
      { name: "Kachua", nameBn: "কচুয়া" },
      { name: "Mollahat", nameBn: "মোল্লাহাট" },
      { name: "Mongla", nameBn: "মোংলা" },
      { name: "Morrelganj", nameBn: "মোড়েলগঞ্জ" },
      { name: "Rampal", nameBn: "রামপাল" },
      { name: "Sarankhola", nameBn: "শরণখোলা" },
    ],
  },
  {
    district: "Chuadanga",
    districtBn: "চুয়াডাঙ্গা",
    division: "Khulna",
    thanas: [
      { name: "Chuadanga Sadar", nameBn: "চুয়াডাঙ্গা সদর" },
      { name: "Alamdanga", nameBn: "আলমডাঙ্গা" },
      { name: "Damurhuda", nameBn: "দামুড়হুদা" },
      { name: "Jibannagar", nameBn: "জীবননগর" },
    ],
  },
  {
    district: "Meherpur",
    districtBn: "মেহেরপুর",
    division: "Khulna",
    thanas: [
      { name: "Meherpur Sadar", nameBn: "মেহেরপুর সদর" },
      { name: "Gangni", nameBn: "গাংনী" },
      { name: "Mujibnagar", nameBn: "মুজিবনগর" },
    ],
  },
  {
    district: "Magura",
    districtBn: "মাগুরা",
    division: "Khulna",
    thanas: [
      { name: "Magura Sadar", nameBn: "মাগুরা সদর" },
      { name: "Mohammadpur", nameBn: "মোহাম্মদপুর" },
      { name: "Shalikha", nameBn: "শালিখা" },
      { name: "Sreepur", nameBn: "শ্রীপুর" },
    ],
  },
  {
    district: "Narail",
    districtBn: "নড়াইল",
    division: "Khulna",
    thanas: [
      { name: "Narail Sadar", nameBn: "নড়াইল সদর" },
      { name: "Kalia", nameBn: "কালিয়া" },
      { name: "Lohagara", nameBn: "লোহাগড়া" },
    ],
  },

  // ==================== CHATTOGRAM DIVISION ====================
  {
    district: "Chattogram",
    districtBn: "চট্টগ্রাম",
    division: "Chattogram",
    thanas: [
      { name: "Kotwali", nameBn: "কোতোয়ালী" },
      { name: "Panchlaish", nameBn: "পাঁচলাইশ" },
      { name: "Pahartali", nameBn: "পাহাড়তলী" },
      { name: "Halishahar", nameBn: "হালিশহর" },
      { name: "Double Mooring", nameBn: "ডবলমুরিং" },
      { name: "Bandar", nameBn: "বন্দর" },
      { name: "Patenga", nameBn: "পতেঙ্গা" },
      { name: "Chandgaon", nameBn: "চাঁদগাঁও" },
      { name: "Bakalia", nameBn: "বাকলিয়া" },
      { name: "Bayazid", nameBn: "বায়োজিদ" },
      { name: "Khulshi", nameBn: "খুলশী" },
      { name: "Akbar Shah", nameBn: "আকবর শাহ" },
      { name: "Karnaphuli", nameBn: "কর্ণফুলী" },
      { name: "EPZ", nameBn: "ইপিজেড" },
      { name: "Sadarghat", nameBn: "সদরঘাট" },
      { name: "Chawkbazar", nameBn: "চকবাজার" },
      { name: "Hathazari", nameBn: "হাটহাজারী" },
      { name: "Sitakunda", nameBn: "সীতাকুণ্ড" },
      { name: "Mirsharai", nameBn: "মীরসরাই" },
      { name: "Patiya", nameBn: "পটিয়া" },
      { name: "Boalkhali", nameBn: "বোয়ালখালী" },
      { name: "Anwara", nameBn: "আনোয়ারা" },
      { name: "Chandanaish", nameBn: "চন্দনাইশ" },
      { name: "Fatikchhari", nameBn: "ফটিকছড়ি" },
      { name: "Banshkhali", nameBn: "বাঁশখালী" },
      { name: "Lohagara", nameBn: "লোহাগাড়া" },
      { name: "Satkania", nameBn: "সাতকানিয়া" },
      { name: "Rangunia", nameBn: "রাঙ্গুনিয়া" },
      { name: "Raozan", nameBn: "রাউজান" },
      { name: "Sandwip", nameBn: "সন্দ্বীপ" },
    ],
  },
  {
    district: "Cox's Bazar",
    districtBn: "কক্সবাজার",
    division: "Chattogram",
    thanas: [
      { name: "Cox's Bazar Sadar", nameBn: "কক্সবাজার সদর" },
      { name: "Chakaria", nameBn: "চকোরিয়া" },
      { name: "Maheshkhali", nameBn: "মহেশখালী" },
      { name: "Teknaf", nameBn: "টেকনাফ" },
      { name: "Ukhiya", nameBn: "উখিয়া" },
      { name: "Ramu", nameBn: "রামু" },
      { name: "Kutubdia", nameBn: "কুতুবদিয়া" },
      { name: "Pekua", nameBn: "পেকুয়া" },
      { name: "Eidgaon", nameBn: "ঈদগাঁও" },
    ],
  },
  {
    district: "Cumilla",
    districtBn: "কুমিল্লা",
    division: "Chattogram",
    thanas: [
      { name: "Cumilla Sadar", nameBn: "কুমিল্লা সদর" },
      { name: "Cumilla Sadar South", nameBn: "কুমিল্লা সদর দক্ষিণ" },
      { name: "Laksam", nameBn: "লাকসাম" },
      { name: "Daudkandi", nameBn: "দাউদকান্দি" },
      { name: "Chandina", nameBn: "চান্দিনা" },
      { name: "Debidwar", nameBn: "দেবিদ্বার" },
      { name: "Homna", nameBn: "হোমনা" },
      { name: "Muradnagar", nameBn: "মুরাদনগর" },
      { name: "Burichang", nameBn: "বুড়িচং" },
      { name: "Brahmanpara", nameBn: "ব্রাহ্মণপাড়া" },
      { name: "Chauddagram", nameBn: "চৌদ্দগ্রাম" },
      { name: "Barura", nameBn: "বরুড়া" },
      { name: "Nangalkot", nameBn: "নাঙ্গলকোট" },
      { name: "Meghna", nameBn: "মেঘনা" },
      { name: "Titas", nameBn: "তিতাস" },
      { name: "Monohargonj", nameBn: "মনোহরগঞ্জ" },
      { name: "Lalmai", nameBn: "লালমাই" },
    ],
  },
  {
    district: "Feni",
    districtBn: "ফেনী",
    division: "Chattogram",
    thanas: [
      { name: "Feni Sadar", nameBn: "ফেনী সদর" },
      { name: "Daganbhuiyan", nameBn: "দাগনভূঞা" },
      { name: "Chhagalnaiya", nameBn: "ছাগলনাইয়া" },
      { name: "Sonagazi", nameBn: "সোনাগাজী" },
      { name: "Parshuram", nameBn: "পরশুরাম" },
      { name: "Fulgazi", nameBn: "ফুলগাজী" },
    ],
  },
  {
    district: "Brahmanbaria",
    districtBn: "ব্রাহ্মণবাড়িয়া",
    division: "Chattogram",
    thanas: [
      { name: "Brahmanbaria Sadar", nameBn: "ব্রাহ্মণবাড়িয়া সদর" },
      { name: "Ashuganj", nameBn: "আশুগঞ্জ" },
      { name: "Nasirnagar", nameBn: "নাসিরনগর" },
      { name: "Nabinagar", nameBn: "নবীনগর" },
      { name: "Sarail", nameBn: "সরাইল" },
      { name: "Kasba", nameBn: "কসবা" },
      { name: "Akhaura", nameBn: "আখাউড়া" },
      { name: "Bancharampur", nameBn: "বাঞ্ছারামপুর" },
      { name: "Bijoynagar", nameBn: "বিজয়নগর" },
    ],
  },
  {
    district: "Noakhali",
    districtBn: "নোয়াখালী",
    division: "Chattogram",
    thanas: [
      { name: "Noakhali Sadar", nameBn: "নোয়াখালী সদর" },
      { name: "Begumganj", nameBn: "বেগমগঞ্জ" },
      { name: "Chatkhil", nameBn: "চাটখিল" },
      { name: "Companiganj", nameBn: "কোম্পানীগঞ্জ" },
      { name: "Hatiya", nameBn: "হাতিয়া" },
      { name: "Senbagh", nameBn: "সেনবাগ" },
      { name: "Sonaimuri", nameBn: "সোনাইমুড়ী" },
      { name: "Subarnachar", nameBn: "সুবর্ণচর" },
      { name: "Kabirhat", nameBn: "কবিরহাট" },
    ],
  },
  {
    district: "Lakshmipur",
    districtBn: "লক্ষ্মীপুর",
    division: "Chattogram",
    thanas: [
      { name: "Lakshmipur Sadar", nameBn: "লক্ষ্মীপুর সদর" },
      { name: "Raipur", nameBn: "রায়পুর" },
      { name: "Ramganj", nameBn: "রামগঞ্জ" },
      { name: "Ramgati", nameBn: "রামগতি" },
      { name: "Kamalnagar", nameBn: "কমলনগর" },
    ],
  },
  {
    district: "Chandpur",
    districtBn: "চাঁদপুর",
    division: "Chattogram",
    thanas: [
      { name: "Chandpur Sadar", nameBn: "চাঁদপুর সদর" },
      { name: "Faridganj", nameBn: "ফরিদগঞ্জ" },
      { name: "Haimchar", nameBn: "হাইমচর" },
      { name: "Haziganj", nameBn: "হাজীগঞ্জ" },
      { name: "Kachua", nameBn: "কচুয়া" },
      { name: "Matlab North", nameBn: "মতলব উত্তর" },
      { name: "Matlab South", nameBn: "মতলব দক্ষিণ" },
      { name: "Shahrasti", nameBn: "শাহরাস্তি" },
    ],
  },
  {
    district: "Khagrachhari",
    districtBn: "খাগড়াছড়ি",
    division: "Chattogram",
    thanas: [
      { name: "Khagrachhari Sadar", nameBn: "খাগড়াছড়ি সদর" },
      { name: "Dighinala", nameBn: "দিঘীনালা" },
      { name: "Panchhari", nameBn: "পানছড়ি" },
      { name: "Mahalchhari", nameBn: "মহালছড়ি" },
      { name: "Matiranga", nameBn: "মাটিরাঙ্গা" },
      { name: "Manikchhari", nameBn: "মানিকছড়ি" },
      { name: "Ramgarh", nameBn: "রামগড়" },
      { name: "Guimara", nameBn: "গুইমারা" },
    ],
  },
  {
    district: "Rangamati",
    districtBn: "রাঙ্গামাটি",
    division: "Chattogram",
    thanas: [
      { name: "Rangamati Sadar", nameBn: "রাঙ্গামাটি সদর" },
      { name: "Kaptai", nameBn: "কাপ্তাই" },
      { name: "Kawkhali", nameBn: "কাউখালী" },
      { name: "Baghaichhari", nameBn: "বাঘাইছড়ি" },
      { name: "Barkal", nameBn: "বরকল" },
      { name: "Langadu", nameBn: "লংগদু" },
      { name: "Rajasthali", nameBn: "রাজস্থলী" },
      { name: "Belaichhari", nameBn: "বিলাইছড়ি" },
      { name: "Juraichhari", nameBn: "জুরাইছড়ি" },
      { name: "Naniarchar", nameBn: "নানিয়ারচর" },
    ],
  },
  {
    district: "Bandarban",
    districtBn: "বান্দরবান",
    division: "Chattogram",
    thanas: [
      { name: "Bandarban Sadar", nameBn: "বান্দরবান সদর" },
      { name: "Ruma", nameBn: "রুমা" },
      { name: "Thanchi", nameBn: "থানচি" },
      { name: "Rowangchhari", nameBn: "রোয়াংছড়ি" },
      { name: "Lama", nameBn: "লামা" },
      { name: "Alikadam", nameBn: "আলীকদম" },
      { name: "Naikhongchhari", nameBn: "নাইক্ষ্যংছড়ি" },
    ],
  },

  // ==================== RAJSHAHI DIVISION ====================
  {
    district: "Rajshahi",
    districtBn: "রাজশাহী",
    division: "Rajshahi",
    thanas: [
      { name: "Boalia", nameBn: "বোয়ালিয়া" },
      { name: "Motihar", nameBn: "মতিহার" },
      { name: "Rajpara", nameBn: "রাজপাড়া" },
      { name: "Shah Makhdum", nameBn: "শাহ মখদুম" },
      { name: "Chandrima", nameBn: "চন্দ্রিমা" },
      { name: "Kashiadanga", nameBn: "কাশিয়াডাঙ্গা" },
      { name: "Katakhali", nameBn: "কাটাখালী" },
      { name: "Airport", nameBn: "বিমানবন্দর" },
      { name: "Paba", nameBn: "পবা" },
      { name: "Durgapur", nameBn: "দুর্গাপুর" },
      { name: "Bagmara", nameBn: "বাগমারা" },
      { name: "Charghat", nameBn: "চারঘাট" },
      { name: "Puthia", nameBn: "পুঠিয়া" },
      { name: "Bagha", nameBn: "বাঘা" },
      { name: "Godagari", nameBn: "গোদাগাড়ী" },
      { name: "Tanore", nameBn: "তানোর" },
      { name: "Mohanpur", nameBn: "মোহনপুর" },
    ],
  },
  {
    district: "Bogura",
    districtBn: "বগুড়া",
    division: "Rajshahi",
    thanas: [
      { name: "Bogura Sadar", nameBn: "বগুড়া সদর" },
      { name: "Shajahanpur", nameBn: "শাহজাহানপুর" },
      { name: "Shibganj", nameBn: "শিবগঞ্জ" },
      { name: "Sherpur", nameBn: "শেরপুর" },
      { name: "Dhunat", nameBn: "ধুনট" },
      { name: "Gabtali", nameBn: "গাবতলী" },
      { name: "Kahaloo", nameBn: "কাহালু" },
      { name: "Nandigram", nameBn: "নন্দীগ্রাম" },
      { name: "Sariakandi", nameBn: "সারিয়াকান্দি" },
      { name: "Sonatola", nameBn: "সোনাতলা" },
      { name: "Adamdighi", nameBn: "আদমদিঘী" },
      { name: "Dupchanchia", nameBn: "দুপচাঁচিয়া" },
    ],
  },
  {
    district: "Pabna",
    districtBn: "পাবনা",
    division: "Rajshahi",
    thanas: [
      { name: "Pabna Sadar", nameBn: "পাবনা সদর" },
      { name: "Ishwardi", nameBn: "ঈশ্বরদী" },
      { name: "Atgharia", nameBn: "আটঘরিয়া" },
      { name: "Bera", nameBn: "বেড়া" },
      { name: "Bhangura", nameBn: "ভাঙ্গুড়া" },
      { name: "Chatmohar", nameBn: "চাটমোহর" },
      { name: "Faridpur", nameBn: "ফরিদপুর" },
      { name: "Santhia", nameBn: "সাঁথিয়া" },
      { name: "Sujanagar", nameBn: "সুজানগর" },
    ],
  },
  {
    district: "Sirajganj",
    districtBn: "সিরাজগঞ্জ",
    division: "Rajshahi",
    thanas: [
      { name: "Sirajganj Sadar", nameBn: "সিরাজগঞ্জ সদর" },
      { name: "Belkuchi", nameBn: "বেলকুচি" },
      { name: "Chauhali", nameBn: "চৌহালী" },
      { name: "Kamarkhanda", nameBn: "কামারখন্দ" },
      { name: "Kazipur", nameBn: "কাজীপুর" },
      { name: "Raiganj", nameBn: "রায়গঞ্জ" },
      { name: "Shahjadpur", nameBn: "শাহজাদপুর" },
      { name: "Tarash", nameBn: "তাড়াশ" },
      { name: "Ullahpara", nameBn: "উল্লাপাড়া" },
    ],
  },
  {
    district: "Naogaon",
    districtBn: "নওগাঁ",
    division: "Rajshahi",
    thanas: [
      { name: "Naogaon Sadar", nameBn: "নওগাঁ সদর" },
      { name: "Atrai", nameBn: "আত্রাই" },
      { name: "Badalgachhi", nameBn: "বদলগাছী" },
      { name: "Dhamoirhat", nameBn: "ধামইরহাট" },
      { name: "Manda", nameBn: "মান্দা" },
      { name: "Mohadevpur", nameBn: "মহাদেবপুর" },
      { name: "Niamatpur", nameBn: "নিয়ামতপুর" },
      { name: "Patnitala", nameBn: "পত্নীতলা" },
      { name: "Porsha", nameBn: "পোরশা" },
      { name: "Raninagar", nameBn: "রাণীনগর" },
      { name: "Sapahar", nameBn: "সাপাহার" },
    ],
  },
  {
    district: "Natore",
    districtBn: "নাটোর",
    division: "Rajshahi",
    thanas: [
      { name: "Natore Sadar", nameBn: "নাটোর সদর" },
      { name: "Bagatipara", nameBn: "বাগাতিপাড়া" },
      { name: "Baraigram", nameBn: "বড়াইগ্রাম" },
      { name: "Gurudaspur", nameBn: "গুরুদাসপুর" },
      { name: "Lalpur", nameBn: "লালপুর" },
      { name: "Singra", nameBn: "সিংড়া" },
      { name: "Naldanga", nameBn: "নলডাঙ্গা" },
    ],
  },
  {
    district: "Chapainawabganj",
    districtBn: "চাঁপাইনবাবগঞ্জ",
    division: "Rajshahi",
    thanas: [
      { name: "Chapainawabganj Sadar", nameBn: "চাঁপাইনবাবগঞ্জ সদর" },
      { name: "Shibganj", nameBn: "শিবগঞ্জ" },
      { name: "Gomostapur", nameBn: "গোমস্তাপুর" },
      { name: "Nachole", nameBn: "নাচোল" },
      { name: "Bholahat", nameBn: "ভোলাহাট" },
    ],
  },
  {
    district: "Joypurhat",
    districtBn: "জয়পুরহাট",
    division: "Rajshahi",
    thanas: [
      { name: "Joypurhat Sadar", nameBn: "জয়পুরহাট সদর" },
      { name: "Akkelpur", nameBn: "আক্কেলপুর" },
      { name: "Kalai", nameBn: "কালাই" },
      { name: "Khetlal", nameBn: "ক্ষেতলাল" },
      { name: "Panchbibi", nameBn: "পাঁচবিবি" },
    ],
  },

  // ==================== SYLHET DIVISION ====================
  {
    district: "Sylhet",
    districtBn: "সিলেট",
    division: "Sylhet",
    thanas: [
      { name: "Kotwali", nameBn: "কোতোয়ালী" },
      { name: "Jalalabad", nameBn: "জালালাবাদ" },
      { name: "Airport", nameBn: "বিমানবন্দর" },
      { name: "Moglabazar", nameBn: "মোগলাবাজার" },
      { name: "Shah Paran", nameBn: "শাহপরাণ" },
      { name: "South Surma", nameBn: "দক্ষিণ সুরমা" },
      { name: "Osmani Nagar", nameBn: "ওসমানী নগর" },
      { name: "Sylhet Sadar", nameBn: "সিলেট সদর" },
      { name: "Beanibazar", nameBn: "বিয়ানীবাজার" },
      { name: "Bishwanath", nameBn: "বিশ্বনাথ" },
      { name: "Companiganj", nameBn: "কোম্পানীগঞ্জ" },
      { name: "Fenchuganj", nameBn: "ফেঞ্চুগঞ্জ" },
      { name: "Golapganj", nameBn: "গোলাপগঞ্জ" },
      { name: "Gowainghat", nameBn: "গোয়াইনঘাট" },
      { name: "Jaintiapur", nameBn: "জৈন্তাপুর" },
      { name: "Kanaighat", nameBn: "কানাইঘাট" },
      { name: "Zakiganj", nameBn: "জকিগঞ্জ" },
    ],
  },
  {
    district: "Moulvibazar",
    districtBn: "মৌলভীবাজার",
    division: "Sylhet",
    thanas: [
      { name: "Moulvibazar Sadar", nameBn: "মৌলভীবাজার সদর" },
      { name: "Barlekha", nameBn: "বড়লেখা" },
      { name: "Juri", nameBn: "জুড়ী" },
      { name: "Kamalganj", nameBn: "কমলগঞ্জ" },
      { name: "Kulaura", nameBn: "কুলাউড়া" },
      { name: "Rajnagar", nameBn: "রাজনগর" },
      { name: "Sreemangal", nameBn: "শ্রীমঙ্গল" },
    ],
  },
  {
    district: "Habiganj",
    districtBn: "হবিগঞ্জ",
    division: "Sylhet",
    thanas: [
      { name: "Habiganj Sadar", nameBn: "হবিগঞ্জ সদর" },
      { name: "Ajmiriganj", nameBn: "আজমিরীগঞ্জ" },
      { name: "Bahubal", nameBn: "বাহুবল" },
      { name: "Baniyachong", nameBn: "বানিয়াচং" },
      { name: "Chunarughat", nameBn: "চুনারুঘাট" },
      { name: "Lakhai", nameBn: "লাখাই" },
      { name: "Madhabpur", nameBn: "মাধবপুর" },
      { name: "Nabiganj", nameBn: "নবীগঞ্জ" },
      { name: "Shayestaganj", nameBn: "শায়েস্তাগঞ্জ" },
    ],
  },
  {
    district: "Sunamganj",
    districtBn: "সুনামগঞ্জ",
    division: "Sylhet",
    thanas: [
      { name: "Sunamganj Sadar", nameBn: "সুনামগঞ্জ সদর" },
      { name: "Bishwamvarpur", nameBn: "বিশ্বম্ভরপুর" },
      { name: "Chhatak", nameBn: "ছাতক" },
      { name: "Derai", nameBn: "দিরাই" },
      { name: "Dharamapasha", nameBn: "ধর্মপাশা" },
      { name: "Dowarabazar", nameBn: "দোয়ারাবাজার" },
      { name: "Jagannathpur", nameBn: "জগন্নাথপুর" },
      { name: "Jamalganj", nameBn: "জামালগঞ্জ" },
      { name: "Sullah", nameBn: "শাল্লা" },
      { name: "Tahirpur", nameBn: "তাহিরপুর" },
      { name: "Shanthiganj", nameBn: "শান্তিগঞ্জ" },
      { name: "Madhyanagar", nameBn: "মধ্যনগর" },
    ],
  },

  // ==================== BARISHAL DIVISION ====================
  {
    district: "Barishal",
    districtBn: "বরিশাল",
    division: "Barishal",
    thanas: [
      { name: "Kotwali", nameBn: "কোতোয়ালী" },
      { name: "Airport", nameBn: "বিমানবন্দর" },
      { name: "Kawnia", nameBn: "কাউনিয়া" },
      { name: "Bandar", nameBn: "বন্দর" },
      { name: "Barishal Sadar", nameBn: "বরিশাল সদর" },
      { name: "Babuganj", nameBn: "বাবুগঞ্জ" },
      { name: "Bakerganj", nameBn: "বাকেরগঞ্জ" },
      { name: "Banaripara", nameBn: "বানারীপাড়া" },
      { name: "Gaurnadi", nameBn: "গৌরনদী" },
      { name: "Hizla", nameBn: "হিজলা" },
      { name: "Mehendiganj", nameBn: "মেহেন্দিগঞ্জ" },
      { name: "Muladi", nameBn: "মুলাদী" },
      { name: "Wazirpur", nameBn: "উজিরপুর" },
      { name: "Agailjhara", nameBn: "আগৈলঝাড়া" },
    ],
  },
  {
    district: "Bhola",
    districtBn: "ভোলা",
    division: "Barishal",
    thanas: [
      { name: "Bhola Sadar", nameBn: "ভোলা সদর" },
      { name: "Burhanuddin", nameBn: "বোরহানউদ্দিন" },
      { name: "Char Fasson", nameBn: "চরফ্যাশন" },
      { name: "Daulatkhan", nameBn: "দৌলতখান" },
      { name: "Lalmohan", nameBn: "লালমোহন" },
      { name: "Manpura", nameBn: "মনপুরা" },
      { name: "Tazumuddin", nameBn: "তজুমদ্দিন" },
    ],
  },
  {
    district: "Patuakhali",
    districtBn: "পটুয়াখালী",
    division: "Barishal",
    thanas: [
      { name: "Patuakhali Sadar", nameBn: "পটুয়াখালী সদর" },
      { name: "Bauphal", nameBn: "বাউফল" },
      { name: "Dashmina", nameBn: "দশমিনা" },
      { name: "Galachipa", nameBn: "গলাচিপা" },
      { name: "Kalapara", nameBn: "কলাপাড়া" },
      { name: "Mirzaganj", nameBn: "মির্জাগঞ্জ" },
      { name: "Rangabali", nameBn: "রাঙ্গাবালী" },
      { name: "Dumki", nameBn: "দুমকি" },
      { name: "Kuakata", nameBn: "কুয়াকাটা" },
    ],
  },
  {
    district: "Pirojpur",
    districtBn: "পিরোজপুর",
    division: "Barishal",
    thanas: [
      { name: "Pirojpur Sadar", nameBn: "পিরোজপুর সদর" },
      { name: "Bhandaria", nameBn: "ভাণ্ডারিয়া" },
      { name: "Kawkhali", nameBn: "কাউখালী" },
      { name: "Mathbaria", nameBn: "মঠবাড়িয়া" },
      { name: "Nazirpur", nameBn: "নাজিরপুর" },
      { name: "Nesarabad", nameBn: "নেছারাবাদ" },
      { name: "Indurkani", nameBn: "ইন্দুরকানী" },
    ],
  },
  {
    district: "Barguna",
    districtBn: "বরগুনা",
    division: "Barishal",
    thanas: [
      { name: "Barguna Sadar", nameBn: "বরগুনা সদর" },
      { name: "Amtali", nameBn: "আমতলী" },
      { name: "Bamna", nameBn: "বামনা" },
      { name: "Betagi", nameBn: "বেতাগী" },
      { name: "Patharghata", nameBn: "পাথরঘাটা" },
      { name: "Taltali", nameBn: "তালতলী" },
    ],
  },
  {
    district: "Jhalokati",
    districtBn: "ঝালকাঠি",
    division: "Barishal",
    thanas: [
      { name: "Jhalokati Sadar", nameBn: "ঝালকাঠি সদর" },
      { name: "Kathalia", nameBn: "কাঠালিয়া" },
      { name: "Nalchity", nameBn: "নলছিটি" },
      { name: "Rajapur", nameBn: "রাজাপুর" },
    ],
  },

  // ==================== RANGPUR DIVISION ====================
  {
    district: "Rangpur",
    districtBn: "রংপুর",
    division: "Rangpur",
    thanas: [
      { name: "Rangpur Sadar", nameBn: "রংপুর সদর" },
      { name: "Badarganj", nameBn: "বদরগঞ্জ" },
      { name: "Gangachhara", nameBn: "গংগাচড়া" },
      { name: "Kaunia", nameBn: "কাউনিয়া" },
      { name: "Mithapukur", nameBn: "মিঠাপুকুর" },
      { name: "Pirgachha", nameBn: "পীরগাছা" },
      { name: "Pirganj", nameBn: "পীরগঞ্জ" },
      { name: "Taraganj", nameBn: "তারাগঞ্জ" },
    ],
  },
  {
    district: "Dinajpur",
    districtBn: "দিনাজপুর",
    division: "Rangpur",
    thanas: [
      { name: "Dinajpur Sadar", nameBn: "দিনাজপুর সদর" },
      { name: "Birampur", nameBn: "বিরামপুর" },
      { name: "Birganj", nameBn: "বীরগঞ্জ" },
      { name: "Bochaganj", nameBn: "বোচাগঞ্জ" },
      { name: "Chirirbandar", nameBn: "চিরিরবন্দর" },
      { name: "Phulbari", nameBn: "ফুলবাড়ী" },
      { name: "Ghoraghat", nameBn: "ঘোড়াঘাট" },
      { name: "Hakimpur", nameBn: "হাকিমপুর" },
      { name: "Kaharole", nameBn: "কাহারোল" },
      { name: "Khansama", nameBn: "খানসামা" },
      { name: "Nawabganj", nameBn: "নবাবগঞ্জ" },
      { name: "Parbatipur", nameBn: "পার্বতীপুর" },
      { name: "Biral", nameBn: "বিরল" },
    ],
  },
  {
    district: "Gaibandha",
    districtBn: "গাইবান্ধা",
    division: "Rangpur",
    thanas: [
      { name: "Gaibandha Sadar", nameBn: "গাইবান্ধা সদর" },
      { name: "Fulchhari", nameBn: "ফুলছড়ি" },
      { name: "Gobindaganj", nameBn: "গোবিন্দগঞ্জ" },
      { name: "Palashbari", nameBn: "পলাশবাড়ী" },
      { name: "Sadullapur", nameBn: "সাদুল্যাপুর" },
      { name: "Sughatta", nameBn: "সাঘাটা" },
      { name: "Sundarganj", nameBn: "সুন্দরগঞ্জ" },
    ],
  },
  {
    district: "Kurigram",
    districtBn: "কুড়িগ্রাম",
    division: "Rangpur",
    thanas: [
      { name: "Kurigram Sadar", nameBn: "কুড়িগ্রাম সদর" },
      { name: "Bhurungamari", nameBn: "ভুরুঙ্গামারী" },
      { name: "Char Rajibpur", nameBn: "চর রাজিবপুর" },
      { name: "Chilmari", nameBn: "চিলমারী" },
      { name: "Nageshwari", nameBn: "নাগেশ্বরী" },
      { name: "Phulbari", nameBn: "ফুলবাড়ী" },
      { name: "Rajarhat", nameBn: "রাজারহাট" },
      { name: "Raomari", nameBn: "রৌমারী" },
      { name: "Ulipur", nameBn: "উলিপুর" },
    ],
  },
  {
    district: "Nilphamari",
    districtBn: "নীলফামারী",
    division: "Rangpur",
    thanas: [
      { name: "Nilphamari Sadar", nameBn: "নীলফামারী সদর" },
      { name: "Saidpur", nameBn: "সৈয়দপুর" },
      { name: "Domar", nameBn: "ডোমার" },
      { name: "Dimla", nameBn: "ডিমলা" },
      { name: "Jaldhaka", nameBn: "জলঢাকা" },
      { name: "Kishoreganj", nameBn: "কিশোরগঞ্জ" },
    ],
  },
  {
    district: "Lalmonirhat",
    districtBn: "লালমনিরহাট",
    division: "Rangpur",
    thanas: [
      { name: "Lalmonirhat Sadar", nameBn: "লালমনিরহাট সদর" },
      { name: "Aditmari", nameBn: "আদিতমারী" },
      { name: "Kaliganj", nameBn: "কালীগঞ্জ" },
      { name: "Hatibandha", nameBn: "হাতীবান্ধা" },
      { name: "Patgram", nameBn: "পাটগ্রাম" },
    ],
  },
  {
    district: "Panchagarh",
    districtBn: "পঞ্চগড়",
    division: "Rangpur",
    thanas: [
      { name: "Panchagarh Sadar", nameBn: "পঞ্চগড় সদর" },
      { name: "Boda", nameBn: "বোদা" },
      { name: "Atwari", nameBn: "আটোয়ারী" },
      { name: "Debiganj", nameBn: "দেবীগঞ্জ" },
      { name: "Tetulia", nameBn: "তেঁতুলিয়া" },
    ],
  },
  {
    district: "Thakurgaon",
    districtBn: "ঠাকুরগাঁও",
    division: "Rangpur",
    thanas: [
      { name: "Thakurgaon Sadar", nameBn: "ঠাকুরগাঁও সদর" },
      { name: "Baliadangi", nameBn: "বালিয়াডাঙ্গী" },
      { name: "Haripur", nameBn: "হরিপুর" },
      { name: "Pirganj", nameBn: "পীরগঞ্জ" },
      { name: "Ranisankail", nameBn: "রাণীশংকৈল" },
    ],
  },

  // ==================== MYMENSINGH DIVISION ====================
  {
    district: "Mymensingh",
    districtBn: "ময়মনসিংহ",
    division: "Mymensingh",
    thanas: [
      { name: "Kotwali", nameBn: "কোতোয়ালী" },
      { name: "Mymensingh Sadar", nameBn: "ময়মনসিংহ সদর" },
      { name: "Bhaluka", nameBn: "ভালুকা" },
      { name: "Trishal", nameBn: "ত্রিশাল" },
      { name: "Haluaghat", nameBn: "হালুয়াঘাট" },
      { name: "Muktagachha", nameBn: "মুক্তাগাছা" },
      { name: "Dhobaura", nameBn: "ধোবাউড়া" },
      { name: "Phulpur", nameBn: "ফুলপুর" },
      { name: "Fulbaria", nameBn: "ফুলবাড়িয়া" },
      { name: "Gauripur", nameBn: "গৌরীপুর" },
      { name: "Ishwarganj", nameBn: "ঈশ্বরগঞ্জ" },
      { name: "Nandail", nameBn: "নান্দাইল" },
      { name: "Tara Khanda", nameBn: "তারাকান্দা" },
    ],
  },
  {
    district: "Jamalpur",
    districtBn: "জামালপুর",
    division: "Mymensingh",
    thanas: [
      { name: "Jamalpur Sadar", nameBn: "জামালপুর সদর" },
      { name: "Bakshiganj", nameBn: "বকশীগঞ্জ" },
      { name: "Dewanganj", nameBn: "দেওয়ানগঞ্জ" },
      { name: "Islampur", nameBn: "ইসলামপুর" },
      { name: "Madarganj", nameBn: "মাদারগঞ্জ" },
      { name: "Melandaha", nameBn: "মেলান্দহ" },
      { name: "Sarishabari", nameBn: "সরিষাবাড়ী" },
    ],
  },
  {
    district: "Netrokona",
    districtBn: "নেত্রকোণা",
    division: "Mymensingh",
    thanas: [
      { name: "Netrokona Sadar", nameBn: "নেত্রকোণা সদর" },
      { name: "Atpara", nameBn: "আটপাড়া" },
      { name: "Barhatta", nameBn: "বারহাট্টা" },
      { name: "Durgapur", nameBn: "দুর্গাপুর" },
      { name: "Khaliajuri", nameBn: "খালিয়াজুরী" },
      { name: "Kalmakanda", nameBn: "কলমাকান্দা" },
      { name: "Kendua", nameBn: "কেন্দুয়া" },
      { name: "Madan", nameBn: "মদন" },
      { name: "Mohanganj", nameBn: "মোহনগঞ্জ" },
      { name: "Purbadhala", nameBn: "পূর্বধলা" },
    ],
  },
  {
    district: "Sherpur",
    districtBn: "শেরপুর",
    division: "Mymensingh",
    thanas: [
      { name: "Sherpur Sadar", nameBn: "শেরপুর সদর" },
      { name: "Jhenaigati", nameBn: "ঝিনাইগাতী" },
      { name: "Nakla", nameBn: "নকলা" },
      { name: "Nalitabari", nameBn: "নালিতাবাড়ী" },
      { name: "Sreebardi", nameBn: "শ্রীবরদী" },
    ],
  },
];

// Flatten all items into searchable list matching Steadfast portal format: "Thana, District"
export const ALL_BD_AREAS: BdAreaItem[] = [];

for (const d of BD_DISTRICTS_DATA) {
  for (const t of d.thanas) {
    const label = `${t.name}, ${d.district}`;
    const id = `${t.name.toLowerCase().replace(/\s+/g, "-")}-${d.district.toLowerCase().replace(/\s+/g, "-")}`;
    ALL_BD_AREAS.push({
      id,
      thana: t.name,
      thanaBn: t.nameBn,
      district: d.district,
      districtBn: d.districtBn,
      division: d.division,
      label,
      searchKeywords: [
        t.name.toLowerCase(),
        t.nameBn,
        d.district.toLowerCase(),
        d.districtBn,
        label.toLowerCase(),
        `${t.nameBn}, ${d.districtBn}`,
      ],
    });
  }
}

/**
 * Intelligent Auto-Fill Parser for Bangladesh addresses:
 * Scans an address string (English or Bengali) to detect the Thana & District
 * Exactly like Steadfast's portal algorithm.
 */
export function detectBdArea(address: string): BdAreaItem | null {
  if (!address || typeof address !== "string") return null;

  const clean = address
    .toLowerCase()
    .replace(/[,\-./#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (clean.length < 2) return null;

  let bestMatch: BdAreaItem | null = null;
  let bestScore = 0;

  for (const item of ALL_BD_AREAS) {
    const thanaLower = item.thana.toLowerCase();
    const distLower = item.district.toLowerCase();
    const thanaBn = item.thanaBn;
    const distBn = item.districtBn;

    let score = 0;

    // Check English thana match
    const hasThana = clean.includes(thanaLower);
    const hasThanaBn = address.includes(thanaBn);

    // Check English district match
    const hasDistrict = clean.includes(distLower);
    const hasDistrictBn = address.includes(distBn);

    if (hasThana && hasDistrict) {
      score = 1000 + thanaLower.length + distLower.length;
    } else if (hasThanaBn && hasDistrictBn) {
      score = 950 + thanaBn.length + distBn.length;
    } else if (hasThana && !hasDistrict) {
      // Thana match without district
      // Give higher priority to distinct thanas (e.g. "Dhanmondi", "Mirpur", "Jhenaidah Sadar")
      if (thanaLower.includes("sadar")) {
        // "Sadar" alone without district name is ambiguous
        const baseName = thanaLower.replace(/\s*sadar/g, "").trim();
        if (clean.includes(baseName)) {
          score = 800 + baseName.length;
        }
      } else {
        score = 600 + thanaLower.length;
      }
    } else if (hasThanaBn && !hasDistrictBn) {
      score = 550 + thanaBn.length;
    } else if (hasDistrict && !hasThana) {
      // Only district matched: pick the Sadar of that district
      if (item.thana.toLowerCase().includes("sadar")) {
        score = 300 + distLower.length;
      }
    } else if (hasDistrictBn && !hasThanaBn) {
      if (item.thanaBn.includes("সদর")) {
        score = 280 + distBn.length;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  // Minimum score threshold
  if (bestScore >= 250) {
    return bestMatch;
  }

  return null;
}

/**
 * Filter and search areas with autocompletion
 */
export function searchBdAreas(query: string, limit = 20): BdAreaItem[] {
  if (!query || !query.trim()) {
    // Return popular metro areas by default
    return ALL_BD_AREAS.slice(0, limit);
  }

  const q = query.toLowerCase().trim();
  const qClean = q.replace(/[,\-./]/g, " ").replace(/\s+/g, " ");

  const results: Array<{ item: BdAreaItem; score: number }> = [];

  for (const item of ALL_BD_AREAS) {
    let score = 0;
    const labelLower = item.label.toLowerCase();
    const thanaLower = item.thana.toLowerCase();
    const distLower = item.district.toLowerCase();

    if (labelLower === q || item.thana.toLowerCase() === q) {
      score = 1000;
    } else if (labelLower.startsWith(q) || thanaLower.startsWith(q)) {
      score = 500;
    } else if (thanaLower.includes(q)) {
      score = 300;
    } else if (distLower.startsWith(q)) {
      score = 200;
    } else if (distLower.includes(q)) {
      score = 100;
    } else if (item.thanaBn.includes(query) || item.districtBn.includes(query)) {
      score = 250;
    }

    if (score > 0) {
      results.push({ item, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit).map((r) => r.item);
}

