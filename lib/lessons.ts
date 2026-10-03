export interface LetterExample {
  kk: string
  ru: string
}

export interface Letter {
  upper: string
  lower: string
  hint: string
  examples: LetterExample[]
}

export interface Question {
  id: string
  prompt: string
  options: string[]
  answer: number // options массивіндегі дұрыс жауаптың нөмірі (0-ден басталады)
  explain: string
}

export interface Lesson {
  id: string
  title: string
  intro: string
  letters: Letter[]
  questions: Question[]
  passScore: number // өту үшін қажет дұрыс жауап саны
  xp: number
}

export const lessonContent: Record<string, Lesson> = {
  'a1-1': {
    id: 'a1-1',
    title: 'Алфавит және дыбыстар',
    intro:
      'Қазақ алфавитінде 42 әріп бар. Орыс тілінде жоқ 9 әріп ерекше дыбыстар береді. Осы сабақта сол 9 әріппен танысамыз.',
    passScore: 6,
    xp: 20,
    letters: [
      {
        upper: 'Ә',
        lower: 'ә',
        hint: 'Открытый звук между «а» и «э», как «a» в английском cat.',
        examples: [
          { kk: 'әке', ru: 'отец' },
          { kk: 'әже', ru: 'бабушка' },
        ],
      },
      {
        upper: 'Ғ',
        lower: 'ғ',
        hint: 'Звонкий горловой «г»: трение в глубине горла, похоже на французское r.',
        examples: [
          { kk: 'ағаш', ru: 'дерево' },
          { kk: 'ғалым', ru: 'учёный' },
        ],
      },
      {
        upper: 'Қ',
        lower: 'қ',
        hint: 'Глубокое «к», которое произносится в глубине горла, дальше, чем обычное К.',
        examples: [
          { kk: 'қала', ru: 'город' },
          { kk: 'қол', ru: 'рука' },
        ],
      },
      {
        upper: 'Ң',
        lower: 'ң',
        hint: 'Носовой звук, как «ng» в английском sing.',
        examples: [
          { kk: 'таң', ru: 'утро, рассвет' },
          { kk: 'аң', ru: 'дикий зверь' },
        ],
      },
      {
        upper: 'Ө',
        lower: 'ө',
        hint: 'Как немецкое ö: скажи «э», округлив губы.',
        examples: [
          { kk: 'көз', ru: 'глаз' },
          { kk: 'өнер', ru: 'искусство' },
        ],
      },
      {
        upper: 'Ү',
        lower: 'ү',
        hint: 'Как немецкое ü: скажи «и», округлив губы.',
        examples: [
          { kk: 'үй', ru: 'дом' },
          { kk: 'күн', ru: 'солнце, день' },
        ],
      },
      {
        upper: 'Ұ',
        lower: 'ұ',
        hint: 'Короткий расслабленный «у», как «u» в английском put.',
        examples: [
          { kk: 'ұл', ru: 'сын' },
          { kk: 'құс', ru: 'птица' },
        ],
      },
      {
        upper: 'І',
        lower: 'і',
        hint: 'Краткий гласный между «и» и «ы», как «i» в английском bit.',
        examples: [
          { kk: 'іс', ru: 'дело' },
          { kk: 'білім', ru: 'знание' },
        ],
      },
      {
        upper: 'Һ',
        lower: 'һ',
        hint: 'Лёгкий выдох, как английское h. Встречается редко, в заимствованных словах.',
        examples: [{ kk: 'һәм', ru: 'и (книжное)' }],
      },
    ],
    questions: [
      {
        id: 'q1',
        prompt: '«үй» сөзі қандай мағына береді?',
        options: ['дом', 'солнце', 'глаз', 'рука'],
        answer: 0,
        explain: '«үй» значит «дом». А «күн» — солнце, «көз» — глаз, «қол» — рука.',
      },
      {
        id: 'q2',
        prompt: '«көз» сөзінің мағынасы қандай?',
        options: ['рука', 'глаз', 'дом', 'птица'],
        answer: 1,
        explain: '«көз» значит «глаз».',
      },
      {
        id: 'q3',
        prompt: '«қол» сөзінің мағынасы қандай?',
        options: ['рука', 'город', 'сын', 'дерево'],
        answer: 0,
        explain: '«қол» значит «рука». Город — «қала».',
      },
      {
        id: 'q4',
        prompt: '«құс» сөзінің мағынасы қандай?',
        options: ['сын', 'птица', 'утро', 'дерево'],
        answer: 1,
        explain: '«құс» значит «птица». Сын — «ұл», утро — «таң».',
      },
      {
        id: 'q5',
        prompt: 'Қай әріп ағылшынша sing сөзіндегі «ng» дыбысын береді?',
        options: ['Ғ', 'Ң', 'Қ', 'Һ'],
        answer: 1,
        explain: 'Буква Ң передаёт носовой звук «ng», как в слове «таң».',
      },
      {
        id: 'q6',
        prompt: 'Жетіспейтін әріпті таңдаңыз: _ке (отец)',
        options: ['А', 'Ә', 'Е', 'І'],
        answer: 1,
        explain: 'Слово «әке» («отец») начинается с буквы Ә.',
      },
      {
        id: 'q7',
        prompt: 'Қай сөз «Қ» әрпінен басталады?',
        options: ['көз', 'қала', 'ғалым', 'үй'],
        answer: 1,
        explain: '«қала» начинается с Қ. «көз» начинается с обычной К, это разные буквы.',
      },
      {
        id: 'q8',
        prompt: '«ағаш» сөзінің мағынасы қандай?',
        options: ['дерево', 'дом', 'небо', 'город'],
        answer: 0,
        explain: '«ағаш» значит «дерево».',
      },
    ],
  },
}