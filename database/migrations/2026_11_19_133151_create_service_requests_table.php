<?php

use App\Enums\ServiceRequestStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title', 100);
            $table->string('description', 500);
            $table->string('priority', 10)->index();
            $table->string('status', 20)->default(ServiceRequestStatus::Open->value)->index();
            $table->timestamps();

            $table->index(['created_by', 'created_at']);
            $table->index('title');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_requests');
    }
};
