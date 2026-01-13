library(googlesheets4)
library(readr)
library(dplyr)
library(tidyr)
library(jsonlite)
library(fs)
library(purrr)
library(lubridate)
library(stringr)

# helper for safely coalescing NULL to ""
`%||%` <- function(a, b) if (is.null(a)) b else a

ss <- "https://docs.google.com/spreadsheets/d/1yo59KnHsybeBC2rqcMkULDS7sBlwjBytP8VON9FU-0g/edit?gid=1449988544#gid=1449988544"
raw <- read_csv("joined_data_dec_2025.csv")
END_DATE <- '2026-01-01'
override <- read_sheet(ss, "OVERRIDE_NOV2025")


df <- raw %>% 
  left_join(
    override,
    by="label"
  ) %>%
  mutate(
    label = coalesce(labelOVERRIDE, label),
    themes = coalesce(categoriesOVERRIDE, categories_above_floor.x)
    ) %>% 
  filter(
    is.na(filterOVERRIDE),
    publish_date < END_DATE
  ) %>%
  select(
    title,
    publish_date,
    media_name,
    url,
    themes,
    event = label
  ) %>% 
  mutate(event = case_when(
    event == 'Noise' ~ NA,
    TRUE ~ event
  ))

########## RECLASSIFICATION STEP


new_data <- df %>%
  rename(label = event, categories_above_floor = themes) %>%
  separate_rows(categories_above_floor, sep = ",\\s*") %>%
  distinct(label, categories_above_floor) %>%
  group_by(label) %>%
  summarise(
    categories_above_floor = paste(sort(categories_above_floor), collapse = ", "),
    .groups = "drop"
  )


rows_to_add <- new_data %>%
  anti_join(select(override, -new), by = "label") %>%
  mutate(new = TRUE)

updated_override <- bind_rows(select(override, -new), rows_to_add)

write_sheet(updated_override, ss, sheet = "OVERRIDE_DEC2025")


########## END RECLASSIFICATION STEP

process_themes <- function(df, output_dir = "themes_json") {
  # Ensure output directory exists
  dir_create(output_dir)
  
  # Split comma-separated themes only for grouping
  df_grouped <- df %>%
    mutate(theme_split = strsplit(themes, "\\s*,\\s*")) %>%
    unnest(theme_split) %>%
    mutate(theme_split = trimws(theme_split)) %>%
    filter(theme_split != "")
  
  # Group by each individual theme and write out JSON of full original rows
  df_grouped %>%
    group_split(theme_split) %>%
    walk(function(group_data) {
      theme_name <- unique(group_data$theme_split)
      file_name <- paste0(output_dir, "/", gsub("[^a-zA-Z0-9_-]", "_", theme_name), ".json")
      # Keep the original CSV 'themes' string in the JSON output
      json <- toJSON(select(group_data, -theme_split), pretty = FALSE, auto_unbox = TRUE)
      write_lines(json, file_name)
    })
}


process_themes(df, "out_json")

#######################################################################################
#######################################################################################



make_monthly_file <- function(df, output_file = "monthly.json") {
  
  # Parse publish_date (handles 'YYYY-MM-DD...' and 'MM/DD/YY')
  pub_iso <- suppressWarnings(ymd(str_sub(df$publish_date %||% "", 1, 10)))
  pub_mdy <- suppressWarnings(mdy(df$publish_date %||% ""))
  df <- df %>%
    mutate(publish_date = coalesce(pub_iso, pub_mdy)) %>%
    filter(!is.na(publish_date))
  
  # Explode comma-separated themes, trim, drop empties
  df_expanded <- df %>%
    mutate(themes = str_split(coalesce(themes, ""), "\\s*,\\s*")) %>%
    unnest(themes) %>%
    mutate(theme = str_trim(themes)) %>%
    filter(theme != "") %>%
    select(-themes) %>%
    mutate(month = floor_date(publish_date, "month"))
  
  if (nrow(df_expanded) == 0) {
    dir_create(path_dir(output_file))
    write_lines("[]", output_file)
    return(invisible(tibble()))
  }
  
  # Counts per (month, theme) – distinct pid if present, else row count
  has_pid <- "pid" %in% names(df_expanded)
  counts <- if (has_pid) {
    df_expanded %>%
      group_by(month, theme) %>%
      summarise(count = n_distinct(pid), .groups = "drop")
  } else {
    df_expanded %>%
      group_by(month, theme) %>%
      summarise(count = dplyr::n(), .groups = "drop")
  }
  
  # Zero-fill full grid (months x themes)
  months_seq <- seq.Date(floor_date(min(df_expanded$publish_date), "month"),
                         floor_date(max(df_expanded$publish_date), "month"),
                         by = "month")
  theme_set <- sort(unique(df_expanded$theme))
  
  full_grid <- crossing(month = months_seq, theme = theme_set) %>%
    left_join(counts, by = c("month", "theme")) %>%
    mutate(count = replace_na(count, 0L)) %>%
    arrange(month, theme)
  
  # Write minified JSON
  out <- full_grid %>%
    mutate(month = as.character(month)) %>%
    select(month, theme, count)
  
  dir_create(path_dir(output_file))
  write_lines(toJSON(out, pretty = FALSE, auto_unbox = TRUE), output_file)
  
  invisible(out)
}

make_monthly_file(df, "out_json/monthly.json")


#######################################################################################
#######################################################################################

count_articles <- function(df, output_file = "article_count.json") {
  
  
  df < filter(df, length(themes) > 0)
  
  # Count total rows (articles)
  count <- nrow(df)
  
  # Prepare JSON object
  out <- list(total_articles = count)
  
  # Ensure output directory exists
  dir_create(path_dir(output_file))
  
  # Write minified JSON
  write_lines(toJSON(out, pretty = FALSE, auto_unbox = TRUE), output_file)
  
  invisible(out)
}

count_articles(df, "out_json/article_count.json")


