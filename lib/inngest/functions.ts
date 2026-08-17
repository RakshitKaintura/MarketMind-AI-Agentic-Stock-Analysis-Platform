import { inngest } from "@/lib/inngest/client";
import { NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT } from "@/lib/inngest/prompts";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "@/lib/nodemailer";
import { getAllUsersForNewsEmail } from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";

// --- Types ---
interface UserForNewsEmail {
    email: string;
    name?: string;
}

interface MarketNewsArticle {
    headline: string;
    summary: string;
    url: string;
    // add other fields from Finnhub as needed
}

// --- Functions ---

export const sendSignUpEmail = inngest.createFunction(
    { 
        id: 'sign-up-email',
        // @ts-ignore
        triggers: [{ event: 'app/user.created' }]
    },
    async ({ event, step }) => {
        const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `;

        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile);

        const response = await step.ai.infer('generate-welcome-intro', {
            model: step.ai.models.gemini({ model: 'gemini-3.6-flash' }),
            body: {
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }]
                    }
                ]
            }
        });

        await step.run('send-welcome-email', async () => {
            const part = response.candidates?.[0]?.content?.parts?.[0];
            const introText = (part && 'text' in part ? part.text : null) || 'Thanks for joining Signalist.';

            const { email, name } = event.data;
            return await sendWelcomeEmail({ email, name, intro: introText });
        });

        return { success: true, message: 'Welcome email sent successfully' };
    }
);

export const sendDailyNewsSummary = inngest.createFunction(
    { 
        id: 'daily-news-summary',
        // @ts-ignore
        triggers: [{ event: 'app/send.daily.news' }, { cron: '0 12 * * *' }]
    },
    async ({ step }) => {
        // Step #1: Explicitly type the result of the database call
        const users = await step.run('get-all-users', async () => {
            const data = await getAllUsersForNewsEmail();
            return data as UserForNewsEmail[];
        });

        if (!users || users.length === 0) return { success: false, message: 'No users found' };

        // Step #2: Fetch news for each user
        const results = await step.run('fetch-user-news', async () => {
            const perUser: Array<{ user: UserForNewsEmail; articles: MarketNewsArticle[] }> = [];
            
            for (const user of users) {
                try {
                    const symbols = await getWatchlistSymbolsByEmail(user.email);
                    let articles = await getNews(symbols);
                    
                    if (!articles || articles.length === 0) {
                        articles = await getNews();
                    }
                    
                    perUser.push({ 
                        user, 
                        articles: (articles || []).slice(0, 6) as MarketNewsArticle[] 
                    });
                } catch (e) {
                    console.error('daily-news: error fetching for', user.email, e);
                    perUser.push({ user, articles: [] });
                }
            }
            return perUser;
        });

        // Step #3: Summarize via AI
        const userNewsSummaries: { user: UserForNewsEmail; newsContent: string | null }[] = [];

        for (const { user, articles } of results) {
            try {
                // We use a unique step ID per user to track progress
                const response = await step.ai.infer(`summarize-news-${user.email}`, {
                    model: step.ai.models.gemini({ model: 'gemini-3.6-flash' }),
                    body: {
                        contents: [{ 
                            role: 'user', 
                            parts: [{ text: NEWS_SUMMARY_EMAIL_PROMPT.replace('{{newsData}}', JSON.stringify(articles)) }] 
                        }]
                    }
                });

                const part = response.candidates?.[0]?.content?.parts?.[0];
                const newsContent = (part && 'text' in part ? part.text : null) || 'No market news today.';
                userNewsSummaries.push({ user, newsContent });
            } catch (e) {
                userNewsSummaries.push({ user, newsContent: null });
            }
        }

        // Step #4: Batch send emails
        await step.run('send-news-emails', async () => {
            await Promise.all(
                userNewsSummaries.map(async ({ user, newsContent }) => {
                    if (!newsContent) return false;
                    return await sendNewsSummaryEmail({ 
                        email: user.email, 
                        date: getFormattedTodayDate(), 
                        newsContent 
                    });
                })
            );
        });

        return { success: true, processed: userNewsSummaries.length };
    }
);