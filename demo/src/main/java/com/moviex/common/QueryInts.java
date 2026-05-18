package com.moviex.common;

public final class QueryInts {

  private QueryInts() {}

  public static int parse(String raw, int def, int min, int max) {
    if (raw == null || raw.isBlank()) {
      return def;
    }
    try {
      int n = Integer.parseInt(raw.trim());
      return Math.min(max, Math.max(min, n));
    } catch (NumberFormatException e) {
      return def;
    }
  }
}
