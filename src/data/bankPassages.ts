import type { ComprehensionQuestion, Level, TopicId, VocabItem } from '../types'
import { BANK_TOPICS } from '../types'

export interface BankPassage {
  key: string // level-topic-index, 고유 id 생성에 사용
  level: Level
  topic: TopicId
  title: string
  sentences: string[]
  vocabulary: VocabItem[]
  questions: ComprehensionQuestion[]
}

function topicLabelOf(topic: TopicId): string {
  return BANK_TOPICS.find((t) => t.id === topic)?.label ?? topic
}

export function getTopicLabel(topic: TopicId): string {
  return topicLabelOf(topic)
}

const RAW_BANK: Omit<BankPassage, 'key'>[] = [
  // ---------------- BEGINNER ----------------
  {
    level: 'beginner',
    topic: 'daily-life',
    title: 'My Morning Routine',
    sentences: [
      'I wake up at seven o\'clock every morning.',
      'First, I brush my teeth and wash my face.',
      'Then I eat a simple breakfast, like toast and eggs.',
      'I usually drink a cup of coffee before I leave home.',
      'I take the bus to work at eight fifteen.',
      'The bus ride takes about twenty minutes.',
      'I always feel ready for the day after my morning routine.',
    ],
    vocabulary: [
      { term: 'routine', meaning: '일과, 정해진 순서', example: 'Having a morning routine helps me stay organized.' },
      { term: 'brush', meaning: '(이를) 닦다, 솔질하다', example: 'Please brush your teeth twice a day.' },
      { term: 'simple', meaning: '간단한', example: 'She made a simple dinner for the family.' },
      { term: 'usually', meaning: '보통, 대개', example: 'I usually go to bed at eleven.' },
      { term: 'ready', meaning: '준비된', example: 'Are you ready to go?' },
    ],
    questions: [
      {
        question: 'What time does the person wake up?',
        choices: ['Six o\'clock', 'Seven o\'clock', 'Eight o\'clock', 'Nine o\'clock'],
        answerIndex: 1,
      },
      {
        question: 'What does the person eat for breakfast?',
        choices: ['Rice and soup', 'Toast and eggs', 'Cereal', 'Nothing'],
        answerIndex: 1,
      },
      {
        question: 'How does the person get to work?',
        choices: ['By car', 'By train', 'By bus', 'On foot'],
        answerIndex: 2,
      },
    ],
  },
  {
    level: 'beginner',
    topic: 'travel',
    title: 'A Trip to the Beach',
    sentences: [
      'Last weekend, my family went to the beach.',
      'We packed sandwiches, water, and a big umbrella.',
      'The drive to the beach took about two hours.',
      'When we arrived, the sky was blue and sunny.',
      'My brother and I swam in the ocean for a long time.',
      'In the afternoon, we built a sandcastle together.',
      'We were tired but very happy on the way home.',
    ],
    vocabulary: [
      { term: 'pack', meaning: '(짐을) 싸다', example: 'I need to pack my bag before the trip.' },
      { term: 'arrive', meaning: '도착하다', example: 'We arrived at the hotel at noon.' },
      { term: 'ocean', meaning: '바다, 대양', example: 'The ocean was calm and clear.' },
      { term: 'sandcastle', meaning: '모래성', example: 'The children built a huge sandcastle.' },
      { term: 'tired', meaning: '피곤한', example: 'I was tired after the long walk.' },
    ],
    questions: [
      {
        question: 'How long was the drive to the beach?',
        choices: ['One hour', 'Two hours', 'Three hours', 'Four hours'],
        answerIndex: 1,
      },
      {
        question: 'What was the weather like?',
        choices: ['Rainy', 'Cloudy', 'Sunny', 'Snowy'],
        answerIndex: 2,
      },
      {
        question: 'What did they build in the afternoon?',
        choices: ['A sandcastle', 'A boat', 'A tent', 'A fire'],
        answerIndex: 0,
      },
    ],
  },
  {
    level: 'beginner',
    topic: 'business',
    title: 'My First Day at Work',
    sentences: [
      'Today was my first day at the new office.',
      'I met my manager and some of my new coworkers.',
      'My manager showed me my desk and my computer.',
      'We had a short meeting about my daily tasks.',
      'For lunch, two coworkers invited me to eat with them.',
      'In the afternoon, I answered emails and organized my files.',
      'I felt a little nervous, but everyone was very kind.',
    ],
    vocabulary: [
      { term: 'manager', meaning: '관리자, 매니저', example: 'My manager gives clear instructions.' },
      { term: 'coworker', meaning: '동료', example: 'I had lunch with a coworker today.' },
      { term: 'task', meaning: '업무, 과제', example: 'I finished all my tasks before five.' },
      { term: 'organize', meaning: '정리하다', example: 'Please organize these files by date.' },
      { term: 'nervous', meaning: '긴장한', example: 'She felt nervous before the interview.' },
    ],
    questions: [
      {
        question: 'Who showed the person their desk?',
        choices: ['A coworker', 'The manager', 'A client', 'The CEO'],
        answerIndex: 1,
      },
      {
        question: 'What did the person do in the afternoon?',
        choices: ['Slept', 'Went home early', 'Answered emails', 'Had a meeting'],
        answerIndex: 2,
      },
      {
        question: 'How did the person feel on the first day?',
        choices: ['Bored', 'Angry', 'A little nervous', 'Very sad'],
        answerIndex: 2,
      },
    ],
  },
  {
    level: 'beginner',
    topic: 'current-events',
    title: 'A New Park in Town',
    sentences: [
      'Our city opened a new park last month.',
      'The park has a big playground for children.',
      'There is also a walking path around a small lake.',
      'Many people bring their dogs to the park every day.',
      'On weekends, families have picnics on the grass.',
      'The city plans to add more trees next year.',
      'People in the town are very happy about the new park.',
    ],
    vocabulary: [
      { term: 'playground', meaning: '놀이터', example: 'The children played at the playground.' },
      { term: 'path', meaning: '길, 오솔길', example: 'We walked along the path by the river.' },
      { term: 'picnic', meaning: '소풍, 피크닉', example: 'We had a picnic in the park.' },
      { term: 'plan', meaning: '계획하다', example: 'They plan to build a new school.' },
      { term: 'town', meaning: '마을, 소도시', example: 'It is a small, quiet town.' },
    ],
    questions: [
      {
        question: 'When did the city open the new park?',
        choices: ['Last week', 'Last month', 'Last year', 'Yesterday'],
        answerIndex: 1,
      },
      {
        question: 'What is around the small lake?',
        choices: ['A road', 'A walking path', 'A parking lot', 'A fence'],
        answerIndex: 1,
      },
      {
        question: 'What does the city plan to add next year?',
        choices: ['More benches', 'More trees', 'A pool', 'A stadium'],
        answerIndex: 1,
      },
    ],
  },
  {
    level: 'beginner',
    topic: 'hobbies',
    title: 'I Love Painting',
    sentences: [
      'On weekends, I like to paint pictures.',
      'I usually paint flowers, mountains, and small animals.',
      'My favorite colors to use are blue and green.',
      'I learned painting from an online video class.',
      'Sometimes my friends ask me to paint pictures for them.',
      'Painting helps me relax after a busy week.',
      'I hope to have my own art show one day.',
    ],
    vocabulary: [
      { term: 'paint', meaning: '(그림을) 그리다, 페인트칠하다', example: 'She likes to paint in the garden.' },
      { term: 'favorite', meaning: '가장 좋아하는', example: 'Blue is my favorite color.' },
      { term: 'relax', meaning: '휴식을 취하다', example: 'I relax by listening to music.' },
      { term: 'busy', meaning: '바쁜', example: 'This week has been very busy.' },
      { term: 'hope', meaning: '바라다, 희망하다', example: 'I hope to visit Japan next year.' },
    ],
    questions: [
      {
        question: 'What does the person usually paint?',
        choices: ['Cars and buildings', 'Flowers, mountains, and animals', 'People', 'Food'],
        answerIndex: 1,
      },
      {
        question: 'How did the person learn painting?',
        choices: ['At school', 'From a book', 'From an online video class', 'From a friend'],
        answerIndex: 2,
      },
      {
        question: 'What is the person\'s dream?',
        choices: ['To sell paintings', 'To have an art show', 'To teach painting', 'To travel'],
        answerIndex: 1,
      },
    ],
  },
  {
    level: 'beginner',
    topic: 'food',
    title: 'Cooking Dinner Tonight',
    sentences: [
      'Tonight, I am going to cook pasta for dinner.',
      'First, I boil water in a big pot.',
      'While the water is hot, I chop tomatoes and onions.',
      'I cook the vegetables in a pan with some olive oil.',
      'Next, I add the cooked pasta to the pan.',
      'Finally, I put some cheese on top of the pasta.',
      'My family always enjoys this simple pasta dinner.',
    ],
    vocabulary: [
      { term: 'boil', meaning: '끓이다', example: 'Boil the water before you add the noodles.' },
      { term: 'chop', meaning: '(잘게) 썰다', example: 'Chop the onions into small pieces.' },
      { term: 'pan', meaning: '팬, 프라이팬', example: 'Heat the pan before you add oil.' },
      { term: 'add', meaning: '추가하다, 넣다', example: 'Add some salt to the soup.' },
      { term: 'enjoy', meaning: '즐기다', example: 'We enjoy eating together on weekends.' },
    ],
    questions: [
      {
        question: 'What is the person cooking tonight?',
        choices: ['Rice', 'Pasta', 'Soup', 'Salad'],
        answerIndex: 1,
      },
      {
        question: 'What does the person chop?',
        choices: ['Tomatoes and onions', 'Carrots and potatoes', 'Apples', 'Bread'],
        answerIndex: 0,
      },
      {
        question: 'What goes on top of the pasta at the end?',
        choices: ['Bread', 'Cheese', 'Eggs', 'Sauce only'],
        answerIndex: 1,
      },
    ],
  },

  // ---------------- INTERMEDIATE ----------------
  {
    level: 'intermediate',
    topic: 'daily-life',
    title: 'Balancing Work and Rest',
    sentences: [
      'Many people find it difficult to balance work and personal life.',
      'After a full day at the office, it can be hard to relax.',
      'I try to set clear boundaries between work time and free time.',
      'For example, I stop checking work emails after seven in the evening.',
      'On weekends, I focus on activities that help me recharge, like reading or hiking.',
      'Taking short breaks during the day also improves my concentration.',
      'Over time, these small habits have made me feel less stressed and more productive.',
    ],
    vocabulary: [
      { term: 'balance', meaning: '균형을 맞추다', example: 'It is important to balance study and rest.' },
      { term: 'boundary', meaning: '경계, 선', example: 'She sets clear boundaries at work.' },
      { term: 'recharge', meaning: '재충전하다', example: 'A short walk helps me recharge.' },
      { term: 'concentration', meaning: '집중력', example: 'Noise can affect your concentration.' },
      { term: 'productive', meaning: '생산적인', example: 'I feel more productive in the morning.' },
    ],
    questions: [
      {
        question: 'What does the writer do after seven in the evening?',
        choices: ['Answers all emails', 'Stops checking work emails', 'Starts a new project', 'Goes to the office'],
        answerIndex: 1,
      },
      {
        question: 'What activities help the writer recharge?',
        choices: ['Reading and hiking', 'Watching TV all day', 'Working overtime', 'Cleaning the house'],
        answerIndex: 0,
      },
      {
        question: 'What is the result of these small habits?',
        choices: ['More stress', 'Less sleep', 'Less stress and more productivity', 'No change'],
        answerIndex: 2,
      },
    ],
  },
  {
    level: 'intermediate',
    topic: 'travel',
    title: 'Getting Lost in a New City',
    sentences: [
      'When I traveled to Lisbon last spring, I decided to explore without a map.',
      'At first, wandering through the narrow streets felt exciting and a bit risky.',
      'After an hour, however, I realized I had no idea where my hotel was.',
      'I asked a local shop owner for directions, but my Portuguese was very limited.',
      'Luckily, she spoke some English and drew a simple map on a napkin.',
      'Following her directions, I finally found my way back just before sunset.',
      'That experience taught me that getting a little lost can lead to memorable moments.',
    ],
    vocabulary: [
      { term: 'explore', meaning: '탐험하다, 답사하다', example: 'We spent the day exploring the old town.' },
      { term: 'wander', meaning: '거닐다, 돌아다니다', example: 'They wandered around the market for hours.' },
      { term: 'risky', meaning: '위험한, 모험적인', example: 'Traveling alone can feel risky at times.' },
      { term: 'limited', meaning: '제한된, 부족한', example: 'My knowledge of French is very limited.' },
      { term: 'memorable', meaning: '기억에 남는', example: 'It was a memorable trip for the whole family.' },
    ],
    questions: [
      {
        question: 'Why did the writer feel lost after an hour?',
        choices: [
          'The hotel moved',
          'The writer explored without a map',
          'The writer fell asleep',
          'The city was closed',
        ],
        answerIndex: 1,
      },
      {
        question: 'How did the shop owner help?',
        choices: [
          'She called a taxi',
          'She drew a map on a napkin',
          'She walked the writer home',
          'She gave directions in Portuguese only',
        ],
        answerIndex: 1,
      },
      {
        question: 'What lesson did the writer learn?',
        choices: [
          'Always use a map',
          'Never travel alone',
          'Getting a little lost can be memorable',
          'Avoid talking to strangers',
        ],
        answerIndex: 2,
      },
    ],
  },
  {
    level: 'intermediate',
    topic: 'business',
    title: 'Preparing for a Job Interview',
    sentences: [
      'Preparing well for a job interview can make a huge difference in the outcome.',
      'First, it helps to research the company\'s products, culture, and recent news.',
      'Next, candidates should practice answering common questions clearly and confidently.',
      'It is also useful to prepare specific examples that show your skills and achievements.',
      'On the day of the interview, arriving a few minutes early shows professionalism.',
      'During the interview, maintaining eye contact and speaking calmly can leave a strong impression.',
      'Finally, sending a short thank-you message afterward is a thoughtful and effective habit.',
    ],
    vocabulary: [
      { term: 'candidate', meaning: '지원자, 후보자', example: 'Three candidates applied for the position.' },
      { term: 'confidently', meaning: '자신 있게', example: 'She answered the question confidently.' },
      { term: 'achievement', meaning: '성취, 업적', example: 'This award is a great achievement.' },
      { term: 'professionalism', meaning: '전문성, 프로다움', example: 'He handled the situation with professionalism.' },
      { term: 'impression', meaning: '인상', example: 'She made a great first impression.' },
    ],
    questions: [
      {
        question: 'What should candidates research before an interview?',
        choices: ['Only the salary', 'The company\'s products, culture, and news', 'The interviewer\'s home address', 'Nothing'],
        answerIndex: 1,
      },
      {
        question: 'What shows professionalism on interview day?',
        choices: ['Arriving late', 'Arriving a few minutes early', 'Skipping the interview', 'Wearing casual clothes'],
        answerIndex: 1,
      },
      {
        question: 'What is recommended after the interview?',
        choices: ['Calling every day', 'Sending a thank-you message', 'Asking for the answer immediately', 'Nothing at all'],
        answerIndex: 1,
      },
    ],
  },
  {
    level: 'intermediate',
    topic: 'current-events',
    title: 'The Rise of Remote Work',
    sentences: [
      'Over the past few years, remote work has become far more common around the world.',
      'Many companies discovered that employees could stay productive while working from home.',
      'As a result, some businesses now offer fully remote or hybrid work options.',
      'This shift has given employees more flexibility to manage their time and location.',
      'However, remote work also brings challenges, such as feeling isolated from coworkers.',
      'To address this, many companies organize regular video meetings and occasional in-person events.',
      'Experts believe that flexible work arrangements will continue to shape the future of employment.',
    ],
    vocabulary: [
      { term: 'remote', meaning: '원격의', example: 'She works remote from another city.' },
      { term: 'hybrid', meaning: '혼합의, 하이브리드의', example: 'Our office uses a hybrid work schedule.' },
      { term: 'flexibility', meaning: '유연성', example: 'This job offers a lot of flexibility.' },
      { term: 'isolated', meaning: '고립된', example: 'Working alone can make you feel isolated.' },
      { term: 'arrangement', meaning: '제도, 준비', example: 'They agreed on a new work arrangement.' },
    ],
    questions: [
      {
        question: 'What did many companies discover about remote employees?',
        choices: [
          'They were less productive',
          'They could stay productive from home',
          'They needed more supervision',
          'They preferred the office',
        ],
        answerIndex: 1,
      },
      {
        question: 'What is one challenge of remote work?',
        choices: ['Too many meetings', 'Feeling isolated', 'Too much travel', 'Higher salaries'],
        answerIndex: 1,
      },
      {
        question: 'How do companies address that challenge?',
        choices: [
          'By banning remote work',
          'With video meetings and in-person events',
          'By reducing salaries',
          'By hiring more managers',
        ],
        answerIndex: 1,
      },
    ],
  },
  {
    level: 'intermediate',
    topic: 'hobbies',
    title: 'Learning to Play the Guitar',
    sentences: [
      'Two years ago, I decided to learn how to play the guitar in my free time.',
      'At the beginning, my fingers hurt every time I practiced the chords.',
      'I watched online tutorials and practiced for about thirty minutes every evening.',
      'Slowly, I became more comfortable switching between chords without looking at my hands.',
      'After several months, I could finally play a full song from start to finish.',
      'Now I sometimes play guitar with friends, which makes practicing even more enjoyable.',
      'Looking back, I am proud that I stayed patient during the difficult early stages.',
    ],
    vocabulary: [
      { term: 'chord', meaning: '(악기의) 코드, 화음', example: 'She learned three new chords today.' },
      { term: 'tutorial', meaning: '강의 영상, 튜토리얼', example: 'I found a helpful guitar tutorial online.' },
      { term: 'comfortable', meaning: '편안한, 익숙한', example: 'He feels comfortable speaking in public now.' },
      { term: 'patient', meaning: '인내심 있는', example: 'You need to be patient when learning a skill.' },
      { term: 'stage', meaning: '단계', example: 'The early stages of learning are the hardest.' },
    ],
    questions: [
      {
        question: 'What happened at the beginning of learning guitar?',
        choices: ['It was easy', 'The fingers hurt', 'The person gave up', 'It was too loud'],
        answerIndex: 1,
      },
      {
        question: 'How did the person practice?',
        choices: [
          'With a private teacher only',
          'Watching tutorials and practicing daily',
          'Once a month',
          'Only with friends',
        ],
        answerIndex: 1,
      },
      {
        question: 'What is the person proud of?',
        choices: [
          'Buying an expensive guitar',
          'Staying patient during the difficult stages',
          'Winning a competition',
          'Teaching others',
        ],
        answerIndex: 1,
      },
    ],
  },
  {
    level: 'intermediate',
    topic: 'food',
    title: 'The Growing Popularity of Plant-Based Diets',
    sentences: [
      'In recent years, more people have started choosing plant-based meals over meat.',
      'Some people switch to plant-based diets for health reasons, hoping to lower their cholesterol.',
      'Others are motivated by concerns about the environment and animal welfare.',
      'Restaurants have responded by adding more vegetarian and vegan options to their menus.',
      'Grocery stores now offer a wider variety of plant-based products, from milk to burgers.',
      'Still, some people find it challenging to get enough protein without eating meat.',
      'Overall, the plant-based food trend seems likely to keep growing in the coming years.',
    ],
    vocabulary: [
      { term: 'plant-based', meaning: '식물성 기반의', example: 'She follows a plant-based diet.' },
      { term: 'cholesterol', meaning: '콜레스테롤', example: 'A healthy diet can lower your cholesterol.' },
      { term: 'motivated', meaning: '동기가 부여된', example: 'He is motivated to eat healthier.' },
      { term: 'vegan', meaning: '비건, 완전 채식의', example: 'This restaurant has several vegan dishes.' },
      { term: 'protein', meaning: '단백질', example: 'Beans are a good source of protein.' },
    ],
    questions: [
      {
        question: 'Why do some people choose plant-based diets?',
        choices: [
          'Only because of price',
          'Health, environment, and animal welfare',
          'Because meat is illegal',
          'Because restaurants require it',
        ],
        answerIndex: 1,
      },
      {
        question: 'How have restaurants responded to this trend?',
        choices: [
          'By removing all menus',
          'By adding more vegetarian and vegan options',
          'By closing down',
          'By raising all prices',
        ],
        answerIndex: 1,
      },
      {
        question: 'What challenge do some people face on a plant-based diet?',
        choices: ['Too much protein', 'Getting enough protein', 'Too many vegetables', 'Cooking time'],
        answerIndex: 1,
      },
    ],
  },

  // ---------------- ADVANCED ----------------
  {
    level: 'advanced',
    topic: 'daily-life',
    title: 'The Quiet Power of Small Habits',
    sentences: [
      'It is tempting to believe that meaningful change requires dramatic, sweeping action, yet research consistently suggests otherwise.',
      'Small, consistent habits, repeated daily, often compound into significant transformations over time.',
      'For instance, reading just ten pages a night may seem trivial, but it adds up to dozens of books a year.',
      'The challenge lies not in starting a new habit, but in sustaining it once the initial motivation fades.',
      'Behavioral scientists argue that linking a new habit to an existing routine makes it far easier to maintain.',
      'Moreover, tracking progress, even informally, reinforces a sense of accomplishment that fuels continued effort.',
      'Ultimately, the accumulation of small, deliberate choices shapes character and outcomes far more than occasional bursts of ambition.',
    ],
    vocabulary: [
      { term: 'sweeping', meaning: '광범위한, 전면적인', example: 'The company announced sweeping reforms.' },
      { term: 'compound', meaning: '누적되다, 복합적으로 작용하다', example: 'Small savings compound into a large sum over time.' },
      { term: 'trivial', meaning: '사소한', example: 'The mistake seemed trivial at first.' },
      { term: 'sustain', meaning: '지속하다, 유지하다', example: 'It is hard to sustain motivation for months.' },
      { term: 'reinforce', meaning: '강화하다', example: 'Positive feedback reinforces good behavior.' },
      { term: 'accumulation', meaning: '축적', example: 'Success is often an accumulation of small efforts.' },
    ],
    questions: [
      {
        question: 'What do behavioral scientists suggest about maintaining habits?',
        choices: [
          'Habits require dramatic willpower',
          'Linking habits to existing routines helps maintain them',
          'Habits should be changed weekly',
          'Tracking progress is unnecessary',
        ],
        answerIndex: 1,
      },
      {
        question: 'According to the passage, what is the real challenge with habits?',
        choices: ['Starting them', 'Sustaining them after motivation fades', 'Explaining them to others', 'Measuring them'],
        answerIndex: 1,
      },
      {
        question: 'What is the main idea of the passage?',
        choices: [
          'Ambition matters more than habits',
          'Small, consistent habits lead to significant change',
          'Reading is the only useful habit',
          'Motivation never fades',
        ],
        answerIndex: 1,
      },
    ],
  },
  {
    level: 'advanced',
    topic: 'travel',
    title: 'Overtourism and the Search for Balance',
    sentences: [
      'In recent years, several of the world\'s most beloved destinations have struggled with the consequences of overtourism.',
      'Cities like Venice and Barcelona have seen local residents priced out of their own neighborhoods by short-term rentals.',
      'Meanwhile, fragile natural sites face erosion and pollution from an overwhelming influx of visitors.',
      'In response, some governments have introduced visitor caps, entry fees, or seasonal restrictions.',
      'Critics argue that such measures can unfairly limit access for budget-conscious travelers.',
      'Others contend that without intervention, the very attractions that draw tourists will be irreversibly damaged.',
      'Striking a sustainable balance between tourism revenue and local well-being remains an unresolved and pressing challenge.',
    ],
    vocabulary: [
      { term: 'overtourism', meaning: '과잉 관광', example: 'Overtourism has changed the character of the old town.' },
      { term: 'fragile', meaning: '취약한, 연약한', example: 'The coral reef is a fragile ecosystem.' },
      { term: 'influx', meaning: '유입, 밀려듦', example: 'The city saw a huge influx of tourists in summer.' },
      { term: 'intervention', meaning: '개입, 조치', example: 'Government intervention slowed the price increase.' },
      { term: 'irreversibly', meaning: '돌이킬 수 없이', example: 'The forest was irreversibly damaged by the fire.' },
      { term: 'pressing', meaning: '긴급한, 시급한', example: 'Climate change is a pressing global issue.' },
    ],
    questions: [
      {
        question: 'What has happened to residents in cities like Venice and Barcelona?',
        choices: [
          'They received free housing',
          'They were priced out by short-term rentals',
          'They stopped working',
          'They moved to rural areas voluntarily',
        ],
        answerIndex: 1,
      },
      {
        question: 'What is one government response to overtourism mentioned in the passage?',
        choices: ['Building more hotels', 'Visitor caps and entry fees', 'Banning all travel', 'Lowering flight prices'],
        answerIndex: 1,
      },
      {
        question: 'What do critics say about visitor restrictions?',
        choices: [
          'They protect only wealthy travelers',
          'They can unfairly limit access for budget travelers',
          'They have no effect',
          'They increase pollution',
        ],
        answerIndex: 1,
      },
    ],
  },
  {
    level: 'advanced',
    topic: 'business',
    title: 'Rethinking Leadership in the Modern Workplace',
    sentences: [
      'Traditional models of leadership, built on hierarchy and top-down authority, are increasingly being questioned in modern organizations.',
      'Younger employees, in particular, tend to value transparency, autonomy, and purpose over rigid chains of command.',
      'As a result, many companies are shifting toward more collaborative leadership styles that emphasize trust and shared decision-making.',
      'This does not mean abandoning structure entirely; rather, it involves redefining the leader\'s role as a facilitator rather than a controller.',
      'Effective leaders in this new model listen actively, provide context rather than commands, and empower teams to solve problems creatively.',
      'Critics caution that excessive flexibility can lead to ambiguity and slower decision-making in high-pressure situations.',
      'Nonetheless, organizations that successfully balance structure with empowerment often report higher engagement and retention.',
    ],
    vocabulary: [
      { term: 'hierarchy', meaning: '위계, 서열', example: 'The company has a strict hierarchy.' },
      { term: 'autonomy', meaning: '자율성', example: 'Employees value autonomy in their work.' },
      { term: 'facilitator', meaning: '촉진자, 조력자', example: 'The manager acts as a facilitator, not a controller.' },
      { term: 'empower', meaning: '권한을 부여하다', example: 'Good leaders empower their teams.' },
      { term: 'ambiguity', meaning: '모호함', example: 'Too much ambiguity can confuse employees.' },
      { term: 'retention', meaning: '(직원) 유지, 보유', example: 'Good benefits improve employee retention.' },
    ],
    questions: [
      {
        question: 'What do younger employees tend to value, according to the passage?',
        choices: [
          'Strict hierarchy',
          'Transparency, autonomy, and purpose',
          'Longer working hours',
          'Fixed job titles',
        ],
        answerIndex: 1,
      },
      {
        question: 'How is the leader\'s role redefined in the new model?',
        choices: ['As a controller', 'As a facilitator', 'As an observer only', 'As unnecessary'],
        answerIndex: 1,
      },
      {
        question: 'What risk do critics associate with excessive flexibility?',
        choices: [
          'Higher costs',
          'Ambiguity and slower decision-making',
          'Too much structure',
          'Lower employee satisfaction',
        ],
        answerIndex: 1,
      },
    ],
  },
  {
    level: 'advanced',
    topic: 'current-events',
    title: 'Artificial Intelligence and the Future of Work',
    sentences: [
      'As artificial intelligence systems grow more capable, debates over their impact on employment have intensified.',
      'Some economists warn that automation could displace millions of workers in fields ranging from manufacturing to customer service.',
      'Others argue that, historically, technological revolutions have created new jobs even as they eliminated old ones.',
      'What seems increasingly clear is that the transition will require significant investment in retraining and education.',
      'Governments and companies alike are exploring policies such as reskilling programs and universal basic income pilots.',
      'Meanwhile, workers in creative and interpersonal fields may find that their skills remain difficult for AI to replicate.',
      'Navigating this transformation thoughtfully will likely determine whether AI ultimately narrows or widens economic inequality.',
    ],
    vocabulary: [
      { term: 'intensify', meaning: '심화되다, 강화되다', example: 'The debate has intensified in recent months.' },
      { term: 'displace', meaning: '대체하다, 밀어내다', example: 'Automation may displace certain jobs.' },
      { term: 'retraining', meaning: '재교육', example: 'The government funded a retraining program.' },
      { term: 'reskilling', meaning: '재교육을 통한 기술 습득', example: 'Reskilling helps workers adapt to new industries.' },
      { term: 'replicate', meaning: '복제하다, 재현하다', example: 'It is hard for AI to replicate human empathy.' },
      { term: 'inequality', meaning: '불평등', example: 'The policy aims to reduce economic inequality.' },
    ],
    questions: [
      {
        question: 'What do some economists warn about automation?',
        choices: [
          'It will create no change',
          'It could displace millions of workers',
          'It only affects farming',
          'It will end within a year',
        ],
        answerIndex: 1,
      },
      {
        question: 'What historical pattern do others point to?',
        choices: [
          'Technology always destroys more jobs than it creates',
          'Technological revolutions have also created new jobs',
          'Technology has no effect on jobs',
          'Jobs never change over time',
        ],
        answerIndex: 1,
      },
      {
        question: 'What will likely determine the effect of AI on inequality?',
        choices: [
          'How thoughtfully the transition is managed',
          'The speed of internet connections',
          'The number of AI companies',
          'Stock market performance',
        ],
        answerIndex: 0,
      },
    ],
  },
  {
    level: 'advanced',
    topic: 'hobbies',
    title: 'Why Deliberate Practice Matters More Than Talent',
    sentences: [
      'Popular culture often celebrates innate talent as the primary driver of expertise, but research tells a more nuanced story.',
      'Psychologists studying elite performers, from musicians to athletes, have found that deliberate practice plays an outsized role.',
      'Unlike casual repetition, deliberate practice involves setting specific goals, seeking feedback, and consistently pushing beyond one\'s comfort zone.',
      'A violinist, for example, might isolate a single difficult passage and repeat it slowly until every note is precise.',
      'This kind of focused, effortful practice is mentally demanding, which is why most people avoid sustaining it for long periods.',
      'Interestingly, studies suggest that thousands of hours of deliberate practice can compensate for a lack of early natural talent.',
      'This finding offers an encouraging message: mastery in a hobby is often more a matter of method than innate ability.',
    ],
    vocabulary: [
      { term: 'innate', meaning: '타고난, 선천적인', example: 'Some people believe musical ability is innate.' },
      { term: 'nuanced', meaning: '미묘한, 세밀한', example: 'The report offers a nuanced view of the issue.' },
      { term: 'deliberate', meaning: '의도적인, 신중한', example: 'Deliberate practice requires full concentration.' },
      { term: 'isolate', meaning: '분리하다, 고립시키다', example: 'She isolated the hardest part of the song to practice.' },
      { term: 'compensate', meaning: '보완하다, 상쇄하다', example: 'Hard work can compensate for a slow start.' },
      { term: 'mastery', meaning: '숙달, 통달', example: 'Mastery of a skill takes years of practice.' },
    ],
    questions: [
      {
        question: 'What does deliberate practice involve, according to the passage?',
        choices: [
          'Casual, unfocused repetition',
          'Setting goals, seeking feedback, and pushing past comfort',
          'Relying only on natural talent',
          'Avoiding difficult passages',
        ],
        answerIndex: 1,
      },
      {
        question: 'Why do most people avoid sustained deliberate practice?',
        choices: [
          'It is too expensive',
          'It is mentally demanding',
          'It requires special equipment',
          'It is not effective',
        ],
        answerIndex: 1,
      },
      {
        question: 'What is the encouraging message of the passage?',
        choices: [
          'Only talented people can master a hobby',
          'Mastery is mostly about method, not innate ability',
          'Practice does not matter much',
          'Talent guarantees success',
        ],
        answerIndex: 1,
      },
    ],
  },
  {
    level: 'advanced',
    topic: 'food',
    title: 'The Hidden Costs of Food Waste',
    sentences: [
      'Every year, roughly a third of all food produced globally is lost or wasted, according to United Nations estimates.',
      'This waste occurs at every stage of the supply chain, from farms and processing plants to restaurants and household kitchens.',
      'Beyond the ethical concern of discarding edible food while millions face hunger, the environmental cost is staggering.',
      'Decomposing food in landfills releases methane, a greenhouse gas far more potent than carbon dioxide in the short term.',
      'Some cities have begun addressing this issue through composting programs and stricter regulations on retailer food disposal.',
      'At the individual level, simple habits like meal planning and proper storage can significantly reduce household waste.',
      'Tackling food waste, experts argue, is one of the most cost-effective strategies available for mitigating climate change.',
    ],
    vocabulary: [
      { term: 'staggering', meaning: '엄청난, 충격적인', example: 'The cost of the project was staggering.' },
      { term: 'decompose', meaning: '분해되다, 부패하다', example: 'Food decomposes faster in warm weather.' },
      { term: 'potent', meaning: '강력한', example: 'Methane is a potent greenhouse gas.' },
      { term: 'composting', meaning: '퇴비화', example: 'The city started a composting program.' },
      { term: 'disposal', meaning: '처리, 폐기', example: 'Proper waste disposal protects the environment.' },
      { term: 'mitigate', meaning: '완화하다', example: 'These steps help mitigate climate change.' },
    ],
    questions: [
      {
        question: 'According to the passage, how much food produced globally is lost or wasted?',
        choices: ['About a tenth', 'About a third', 'About half', 'Almost none'],
        answerIndex: 1,
      },
      {
        question: 'What happens when food decomposes in landfills?',
        choices: [
          'It produces clean energy',
          'It releases methane',
          'It has no environmental effect',
          'It turns into fertilizer automatically',
        ],
        answerIndex: 1,
      },
      {
        question: 'What can individuals do to reduce food waste?',
        choices: [
          'Buy more food than needed',
          'Meal planning and proper storage',
          'Avoid cooking at home',
          'Ignore expiration dates',
        ],
        answerIndex: 1,
      },
    ],
  },
]

export const BANK_PASSAGES: BankPassage[] = RAW_BANK.map((p, idx) => ({
  ...p,
  key: `${p.level}-${p.topic}-${idx}`,
}))
