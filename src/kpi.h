#pragma once

#include <vector>

#include "models.h"

KPIResult ComputeKPI(const InputData& input,
                     const std::vector<Allocation>& allocations);
