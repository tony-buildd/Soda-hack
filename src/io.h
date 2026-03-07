#pragma once

#include <string>

#include "models.h"

bool LoadInputJson(const std::string& path, InputData* out, std::string* error);

bool SaveSolveResultJson(const std::string& path, const SolveResult& result,
                         std::string* error);
