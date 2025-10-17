library(dplyr)
library(tidyr)
library(jsonlite)
library(readr)
library(fs)
library(purrr)

library(dplyr)
library(tidyr)
library(jsonlite)
library(readr)
library(fs)
library(purrr)

process_themes <- function(input_csv, output_dir = "themes_json") {
  # Read CSV
  df <- read_csv(input_csv, show_col_types = FALSE)
  
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


process_themes("launch_0p85_threshold.csv", "out_json")

#######################################################################################
#######################################################################################
library(dplyr)
library(tidyr)
library(readr)
library(lubridate)
library(stringr)
library(jsonlite)
library(fs)

# helper for safely coalescing NULL to ""
`%||%` <- function(a, b) if (is.null(a)) b else a

make_monthly_file <- function(input_csv, output_file = "monthly.json") {
  df <- read_csv(input_csv, show_col_types = FALSE)
  
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

make_monthly_file("launch_0p85_threshold.csv", "out_json/monthly.json")


#######################################################################################
#######################################################################################

library(readr)
library(jsonlite)
library(fs)

count_articles <- function(input_csv, output_file = "article_count.json") {
  # Read CSV
  df <- read_csv(input_csv, show_col_types = FALSE)
  
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

count_articles("launch_0p85_threshold.csv", "out_json/article_count.json")


