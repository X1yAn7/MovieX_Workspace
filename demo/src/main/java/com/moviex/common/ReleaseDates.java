package com.moviex.common;

public final class ReleaseDates {

  private ReleaseDates() {}

  public static Integer parseYear(String releaseDate) {
    if (releaseDate == null || releaseDate.isBlank()) return null;
    String s = releaseDate.trim();
    if (s.length() < 4) return null;
    try {
      int y = Integer.parseInt(s.substring(0, 4));
      return y;
    } catch (NumberFormatException e) {
      return null;
    }
  }

  /** 得不到则返回 6（与 Node parseMonth 一致） */
  public static int parseMonthOrdinal(String dateStr) {
    if (dateStr == null || dateStr.isBlank()) return 6;
    String s = dateStr.trim();
    String[] hy = s.split("-");
    if (hy.length >= 2) {
      try {
        int m = Integer.parseInt(hy[1]);
        if (m >= 1 && m <= 12) return m;
      } catch (NumberFormatException ignored) {
      }
    }
    var sl = java.util.regex.Pattern.compile("^(\\d{4})[/-](\\d{1,2})").matcher(s);
    if (sl.find()) {
      try {
        int m = Integer.parseInt(sl.group(2));
        if (m >= 1 && m <= 12) return m;
      } catch (NumberFormatException ignored) {
      }
    }
    return 6;
  }
}
