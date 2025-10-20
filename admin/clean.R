old <- read_csv("launch_0p85_threshold.csv")
new <- read_csv("data (1).csv")

asOfJune <- read_csv("all_data_tji_tags_threshold_0_85 (1).csv")

old_deduped <- old %>%
  group_by(url) %>%
  slice_max(nchar(themes), with_ties = FALSE) %>%
  ungroup()

# Redundant but sanity check
new_deduped <- new %>%
  group_by(url) %>%
  slice_max(nchar(categories_above_floor), with_ties = FALSE) %>%
  ungroup()


# old_noise_remove <- filter(old_deduped, !is.na(event))
# new_noise_remove <- filter(new, label != 'Noise')

old_noise_remove <- old_deduped %>% 
  filter(nchar(themes) > 0)

new_noise_remove <- new_deduped %>% 
  filter(nchar(categories_above_floor) > 0)

nrow(old_noise_remove)
nrow(new_noise_remove)


length(unique(old_noise_remove$event))
length(unique(new_noise_remove$label))


old_events <- old_noise_remove %>% 
  group_by(event) %>% 
  summarise(count = n()) %>% 
  arrange(desc(count))


new_events <- new_noise_remove %>% 
  group_by(label) %>% 
  summarise(count = n()) %>% 
  arrange(desc(count))


filter(old_noise_remove, is.na(event)) %>%  nrow()
filter(new_noise_remove, label == "Noise") %>%  nrow()



# Clean

roundups <- c("AP Top News", 
              "AP Top Political News", 
              "AP Health News", 
              "AP Top Headlines", 
              "Daily News", 
              "Top News", 
              "AP Sports News", 
              "Executive Summary", 
              "AP Top Health News", 
              "Reader Feedback", 
              "Fridays News", 
              "AP Top Sports News", 
              "Beacon Hill Roll Call", 
              "Daily Briefing", 
              "Weekly News", 
              "Daily Roundup", 
              "South Florida News", 
              "CBS Evening News Headlines", 
              "Entertainment News", 
              "Executive News Summary", 
              "CBS Evening News", 
              "Washington Post News", 
              "Daily Business Briefing", 
              "CBS News", 
              "Daily Quotes", 
              "AP Top Stories", 
              "International News", 
              "Today in History", 
              "Thursday Briefing", 
              "Corrections", 
              "Things To Do in"
)

under_10_article_events <- new_events %>% 
  filter(count < 10) %>%
  pull(label)

new_noise_clean <-new_noise_remove %>%
  rename(themes = categories_above_floor,
         event = label) %>% 
  mutate(event = case_when(
    event == 'Noise' ~ NA,
    TRUE ~ event
  )) %>% 
filter(
  !event %in% roundups,
  !event %in% under_10_article_events
)
    
 
write_csv(new_noise_clean, "data_clean.csv")


