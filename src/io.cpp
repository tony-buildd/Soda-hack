#include "io.h"

#include <cmath>
#include <fstream>

#include <nlohmann/json.hpp>

namespace {

using nlohmann::json;

double Round2(double x) { return std::round(x * 100.0) / 100.0; }

}  // namespace

bool LoadInputJson(const std::string& path, InputData* out, std::string* error) {
  if (out == nullptr) {
    if (error) {
      *error = "Output pointer is null.";
    }
    return false;
  }

  std::ifstream fin(path);
  if (!fin) {
    if (error) {
      *error = "Cannot open input file: " + path;
    }
    return false;
  }

  json j;
  try {
    fin >> j;

    out->teachers.clear();
    out->schools.clear();

    for (const auto& jt : j.at("teachers")) {
      Teacher t;
      t.id = jt.at("id").get<std::string>();
      t.name = jt.value("name", t.id);
      t.capacity = jt.at("capacity").get<int>();
      t.subjects = jt.at("subjects").get<std::vector<std::string>>();

      const auto& base = jt.at("base");
      t.base.lat = base.at(0).get<double>();
      t.base.lng = base.at(1).get<double>();

      out->teachers.push_back(t);
    }

    for (const auto& js : j.at("schools")) {
      School s;
      s.id = js.at("id").get<std::string>();
      s.name = js.value("name", s.id);
      s.priority = js.value("priority", 1);

      const auto& loc = js.at("location");
      s.location.lat = loc.at(0).get<double>();
      s.location.lng = loc.at(1).get<double>();

      for (auto it = js.at("demand").begin(); it != js.at("demand").end(); ++it) {
        s.demand[it.key()] = it.value().get<int>();
      }

      out->schools.push_back(s);
    }
  } catch (const std::exception& e) {
    if (error) {
      *error = std::string("Failed to parse JSON: ") + e.what();
    }
    return false;
  }

  return true;
}

bool SaveSolveResultJson(const std::string& path, const SolveResult& result,
                         std::string* error) {
  json j;
  j["allocations"] = json::array();

  for (const Allocation& alloc : result.allocations) {
    j["allocations"].push_back({
        {"teacher", alloc.teacher},
        {"school", alloc.school},
        {"subject", alloc.subject},
        {"hours", alloc.hours},
    });
  }

  j["kpi"] = {
      {"coverage_pct", Round2(result.kpi.coverage_pct)},
      {"total_travel_km", Round2(result.kpi.total_travel_km)},
      {"workload_std", Round2(result.kpi.workload_std)},
      {"unmet_demand", json::array()},
  };

  for (const UnmetDemand& unmet : result.kpi.unmet_demand) {
    j["kpi"]["unmet_demand"].push_back({
        {"school", unmet.school},
        {"subject", unmet.subject},
        {"missing_hours", unmet.missing_hours},
    });
  }

  std::ofstream fout(path);
  if (!fout) {
    if (error) {
      *error = "Cannot open output file: " + path;
    }
    return false;
  }

  fout << j.dump(2) << '\n';
  return true;
}
