#pragma once

#include <algorithm>
#include <cmath>
#include <map>
#include <string>
#include <vector>

struct LatLng {
  double lat = 0.0;
  double lng = 0.0;
};

struct Teacher {
  std::string id;
  std::string name;
  int capacity = 0;
  std::vector<std::string> subjects;
  LatLng base;
};

struct School {
  std::string id;
  std::string name;
  int priority = 1;
  LatLng location;
  std::map<std::string, int> demand;
};

struct InputData {
  std::vector<Teacher> teachers;
  std::vector<School> schools;
};

struct Allocation {
  std::string teacher;
  std::string school;
  std::string subject;
  int hours = 0;
};

struct UnmetDemand {
  std::string school;
  std::string subject;
  int missing_hours = 0;
};

struct KPIResult {
  double coverage_pct = 0.0;
  double total_travel_km = 0.0;
  double workload_std = 0.0;
  std::vector<UnmetDemand> unmet_demand;
};

struct SolveResult {
  std::vector<Allocation> allocations;
  KPIResult kpi;
};

inline bool TeacherCanTeach(const Teacher& teacher, const std::string& subject) {
  return std::find(teacher.subjects.begin(), teacher.subjects.end(), subject) !=
         teacher.subjects.end();
}

inline double HaversineKm(const LatLng& a, const LatLng& b) {
  constexpr double kEarthRadiusKm = 6371.0;
  constexpr double kPi = 3.14159265358979323846;

  const double lat1 = a.lat * kPi / 180.0;
  const double lon1 = a.lng * kPi / 180.0;
  const double lat2 = b.lat * kPi / 180.0;
  const double lon2 = b.lng * kPi / 180.0;

  const double dlat = lat2 - lat1;
  const double dlon = lon2 - lon1;
  const double sin_dlat = std::sin(dlat / 2.0);
  const double sin_dlon = std::sin(dlon / 2.0);

  const double h = sin_dlat * sin_dlat +
                   std::cos(lat1) * std::cos(lat2) * sin_dlon * sin_dlon;
  const double c = 2.0 * std::atan2(std::sqrt(h), std::sqrt(1.0 - h));

  return kEarthRadiusKm * c;
}
