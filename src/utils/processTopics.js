import { group, rollup } from 'd3-array';
import { timeParse, timeFormat } from 'd3-time-format';
import { timeDay } from 'd3-time';
import leanData from '../data/lean.csv';

const leanMap = new Map(leanData.map(d => [d.domain, d.aggLean]));


/**
 * Processes article data to group by topic, calculate daily counts, and find publication prevalence.
 *
 * @param {Array<Object>} data - The array of article objects.
 * @param {Date} minDate - The start of the date range.
 * @param {Date} maxDate - The end of the date range.
 * @returns {Promise<Object>} - An object with topics as keys. Each topic has daily counts and publication prevalence.
 */
export function processDataByTopic(data, minDate, maxDate) {
  const parseDate = timeParse('%Y-%m-%d');

  const dataWithDates = data.map(d => ({
    ...d,
    publish_date_obj: parseDate(d.publish_date),
    lean: leanMap.get(d.media_name) || 'unknown'
  }));

  const groupedByTopic = group(dataWithDates, d => d.topic);

  const result = {};

  for (const [topic, articles] of groupedByTopic) {
    // Determine most and least prevalent publication
    const publicationCounts = rollup(articles, v => v.length, d => d.media_name);

    if (publicationCounts.size > 0) {
      const counts = Array.from(publicationCounts.values());
      const minCount = Math.min(...counts);
      const maxCount = Math.max(...counts);

      const mostPrevalentPublication = [];
      const leastPrevalentPublication = [];

      for (const [name, count] of publicationCounts) {
        if (count === maxCount) {
          mostPrevalentPublication.push(name);
        }
        if (count === minCount) {
          leastPrevalentPublication.push(name);
        }
      }

      // Provide a daily count of articles
      const dateCounts = rollup(articles, v => v.length, d => timeFormat('%Y-%m-%d')(d.publish_date_obj));

      const dailyCounts = [];
      for (let day = timeDay(minDate); day <= maxDate; day = timeDay.offset(day, 1)) {
        const dayStr = timeFormat('%Y-%m-%d')(day);
        dailyCounts.push({
          date: day,
          count: dateCounts.get(dayStr) || 0
        });
      }

      // Calculate lean distribution
      const leanDistribution = rollup(articles, v => v.length, d => d.lean);
      const totalArticles = articles.length;

      const publicationLean = {};
      for (const [lean, count] of leanDistribution) {
        publicationLean[lean] = count / totalArticles;
      }


      result[topic] = {
        articles,
        mostPrevalentPublication,
        leastPrevalentPublication,
        dailyCounts,
        publicationLean
      };
    }
  }

  console.log(result);

  return result;
}
