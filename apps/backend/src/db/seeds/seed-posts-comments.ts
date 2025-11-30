import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../../.env') });

import { logger } from '../../lib/logger.js';
import { db } from '../connection.js';
import { users, posts, comments } from '../schema/schema.js';
import { eq } from 'drizzle-orm';

const POST_COUNT = 100;
const COMMENTS_PER_POST = 100;

const realisticPostTemplates = [
  "Just finished reading {book} and it completely changed my perspective on {topic}. Has anyone else read it?",
  "Working on a new project involving {tech}. The learning curve is steep but really enjoying it!",
  "Had an amazing {activity} today. Sometimes you need to step back and appreciate the little things.",
  "Question for the community: What's your take on {topic}? I've been thinking about this a lot lately.",
  "Just discovered {thing} and I'm obsessed. Why did no one tell me about this sooner?",
  "Spent the weekend {activity}. It was exactly what I needed to recharge.",
  "Anyone else struggling with {problem}? Looking for advice or just want to vent together.",
  "Today I learned that {fact}. Mind blown! 🤯",
  "Reflecting on {topic} and how much has changed in the past year. Growth is real.",
  "Sharing some thoughts on {topic}. Would love to hear different perspectives!",
  "Just tried {thing} for the first time. Not sure how I feel about it yet.",
  "Can we talk about how {observation}? This needs more attention.",
  "Working through {challenge} and documenting the journey. Day {number} and still going strong!",
  "Found this amazing {resource} that helped me understand {topic} better. Sharing in case it helps others.",
  "Sometimes you need to {action} to realize what you really want. Life lesson learned today.",
  "Deep dive into {topic} has me questioning everything I thought I knew.",
  "Celebrating a small win today: {achievement}. Progress, not perfection!",
  "Anyone have recommendations for {thing}? Looking to explore new options.",
  "The way {observation} is fascinating. Nature/technology/humanity is wild.",
  "Just had a conversation about {topic} that left me with more questions than answers.",
];

const realisticCommentTemplates = [
  "Great point! I totally agree with you on this.",
  "Interesting perspective. I hadn't thought about it that way before.",
  "This resonates with me so much. Thanks for sharing!",
  "I've had a similar experience. It's nice to know I'm not alone.",
  "Could you elaborate more on {aspect}? I'm curious to learn more.",
  "This is exactly what I needed to hear today. Thank you!",
  "I respectfully disagree, but I see where you're coming from.",
  "Has anyone tried {alternative}? I'm wondering if that might work better.",
  "This reminds me of {related_thing}. The parallels are interesting.",
  "I'm going through something similar right now. Any advice?",
  "Love this! Adding it to my list of things to check out.",
  "This is so relatable. You put it into words perfectly.",
  "I'm not sure I understand. Can someone explain this differently?",
  "This is a game changer. Why didn't I know about this sooner?",
  "I have mixed feelings about this, but I appreciate the discussion.",
  "This is exactly the kind of content I come here for. More please!",
  "I've been thinking about this too. Your take is really insightful.",
  "Not sure if this is relevant, but {related_thought}.",
  "This makes so much sense. I wish more people understood this.",
  "I'm skeptical, but open to being convinced. What's your evidence?",
  "This is helpful, thanks! Going to try this out.",
  "I disagree, but I respect your opinion. Here's why I think differently...",
  "Can't wait to see where this goes. Keep us updated!",
  "This is the kind of post that makes me love this community.",
  "I'm new to this topic. Can someone point me to good resources?",
];

const topics = [
  "technology", "programming", "books", "movies", "music", "travel", "food", "fitness",
  "photography", "art", "science", "philosophy", "relationships", "career", "education",
  "health", "environment", "politics", "sports", "gaming", "design", "business",
  "entrepreneurship", "mental health", "productivity", "creativity", "innovation"
];

const activities = [
  "hiking", "cooking", "reading", "coding", "painting", "photography", "yoga",
  "meditation", "writing", "gardening", "traveling", "learning", "exercising",
  "volunteering", "exploring", "creating", "building", "designing", "studying"
];

const tech = [
  "React", "TypeScript", "Node.js", "Python", "machine learning", "cloud computing",
  "blockchain", "AI", "web development", "mobile apps", "databases", "APIs"
];

const books = [
  "The Seven Husbands of Evelyn Hugo", "Atomic Habits", "The Midnight Library",
  "Project Hail Mary", "Educated", "Sapiens", "The Psychology of Money"
];

const things = [
  "this new app", "this podcast", "this technique", "this method", "this approach",
  "this tool", "this framework", "this concept", "this idea"
];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRealisticPost(): string {
  const template = randomElement(realisticPostTemplates);
  let content = template;
  
  content = content.replace(/{book}/g, () => randomElement(books));
  content = content.replace(/{topic}/g, () => randomElement(topics));
  content = content.replace(/{activity}/g, () => randomElement(activities));
  content = content.replace(/{tech}/g, () => randomElement(tech));
  content = content.replace(/{thing}/g, () => randomElement(things));
  content = content.replace(/{problem}/g, () => randomElement([
    "work-life balance", "time management", "motivation", "decision making",
    "learning new skills", "staying focused", "finding purpose"
  ]));
  content = content.replace(/{fact}/g, () => randomElement([
    "octopuses have three hearts", "honey never spoils", "the human brain uses 20% of the body's energy",
    "there are more possible chess games than atoms in the observable universe"
  ]));
  content = content.replace(/{observation}/g, () => randomElement([
    "people connect through shared experiences", "technology is advancing faster than ever",
    "we're all just trying our best", "small actions create big changes"
  ]));
  content = content.replace(/{challenge}/g, () => randomElement([
    "learning a new language", "building a side project", "maintaining a workout routine",
    "meditation practice", "writing daily"
  ]));
  content = content.replace(/{number}/g, () => randomInt(1, 30).toString());
  content = content.replace(/{resource}/g, () => randomElement([
    "article", "video", "course", "book", "podcast", "tutorial"
  ]));
  content = content.replace(/{action}/g, () => randomElement([
    "step back", "take a break", "try something new", "change your perspective"
  ]));
  content = content.replace(/{achievement}/g, () => randomElement([
    "completed my first project", "ran 5km without stopping", "read 10 books this month",
    "learned a new skill", "helped someone today"
  ]));
  
  if (Math.random() > 0.7) {
    content += " " + randomElement([
      "What do you all think?", "Would love to hear your thoughts!", 
      "Anyone else relate?", "Let's discuss!", "Your experiences?"
    ]);
  }
  
  if (Math.random() > 0.8) {
    content += "\n\n" + randomElement([
      "Edit: Thanks for all the responses! This blew up more than I expected.",
      "Update: I've been reading through the comments and learning so much.",
      "PS: Keep the discussion going, this is really helpful!",
    ]);
  }
  
  return content;
}

function generateRealisticComment(postContent: string): string {
  const template = randomElement(realisticCommentTemplates);
  let content = template;
  
  content = content.replace(/{aspect}/g, () => randomElement([
    "the technical details", "your experience", "how you got started",
    "the challenges you faced", "what you learned"
  ]));
  content = content.replace(/{alternative}/g, () => randomElement([
    "a different approach", "another method", "this alternative",
    "something else", "another option"
  ]));
  content = content.replace(/{related_thing}/g, () => randomElement([
    "something similar I read", "a related experience", "another post I saw",
    "a book I'm reading", "a conversation I had"
  ]));
  content = content.replace(/{related_thought}/g, () => randomElement([
    "I wonder if this applies to other situations too",
    "This might be related to what OP mentioned",
    "I had a similar thought process",
    "This connects to something I've been thinking about"
  ]));
  
  if (Math.random() > 0.6) {
    content += " " + randomElement([
      "What do you think?", "Anyone else?", "Thoughts?", 
      "Would love to hear more!", "Keep us updated!"
    ]);
  }
  
  if (Math.random() > 0.85) {
    content = randomElement([
      "This! 👆",
      "Exactly this.",
      "Couldn't have said it better.",
      "100% agree.",
      "Same here!",
      "This is the way.",
      "Preach! 🙌",
      "So true!",
    ]);
  }
  
  return content;
}

function randomDateInPast(daysAgo: number): Date {
  const now = Date.now();
  const daysInMs = daysAgo * 24 * 60 * 60 * 1000;
  const randomMs = Math.random() * daysInMs;
  return new Date(now - randomMs);
}

async function seedPostsAndComments() {
  logger.info('Starting posts and comments seed...');

  try {
    const allUsers = await db.select().from(users);
    if (allUsers.length === 0) {
      logger.error('No users found in database. Please create users first.');
      process.exit(1);
    }

    logger.info(`Found ${allUsers.length} users. Using them as authors.`);

    const userIds = allUsers.map(u => u.id);
    const createdPosts: string[] = [];

    logger.info(`Creating ${POST_COUNT} posts...`);

    for (let i = 0; i < POST_COUNT; i++) {
      const authorId = randomElement(userIds);
      const content = generateRealisticPost();
      const createdAt = randomDateInPast(30);
      
      const [post] = await db.insert(posts).values({
        authorId,
        content,
        createdAt,
        updatedAt: createdAt,
      }).returning({ id: posts.id });

      createdPosts.push(post.id);

      if ((i + 1) % 10 === 0) {
        logger.info(`Created ${i + 1}/${POST_COUNT} posts...`);
      }
    }

    logger.info(`All ${POST_COUNT} posts created. Now creating ${COMMENTS_PER_POST} comments per post...`);

    let totalComments = 0;
    for (let postIndex = 0; postIndex < createdPosts.length; postIndex++) {
      const postId = createdPosts[postIndex];
      
      const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
      const postContent = post[0]?.content || '';
      const postCreatedAt = post[0]?.createdAt || new Date();

      const commentsBatch: Array<{
        postId: string;
        authorId: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
      }> = [];

      for (let j = 0; j < COMMENTS_PER_POST; j++) {
        const authorId = randomElement(userIds);
        const content = generateRealisticComment(postContent);
        const commentCreatedAt = new Date(
          postCreatedAt.getTime() + Math.random() * (Date.now() - postCreatedAt.getTime())
        );

        commentsBatch.push({
          postId,
          authorId,
          content,
          createdAt: commentCreatedAt,
          updatedAt: commentCreatedAt,
        });
      }

      await db.insert(comments).values(commentsBatch);
      totalComments += COMMENTS_PER_POST;

      if ((postIndex + 1) % 10 === 0) {
        logger.info(`Created comments for ${postIndex + 1}/${POST_COUNT} posts (${totalComments} total comments)...`);
      }
    }

    logger.info(`✅ Successfully seeded ${POST_COUNT} posts with ${COMMENTS_PER_POST} comments each (${totalComments} total comments)`);
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Seed failed');
    process.exit(1);
  }
}

seedPostsAndComments();

